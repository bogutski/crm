import mongoose from 'mongoose';
import { Pipeline, PipelineStage, IPipeline, IPipelineStage } from './model';
import {
  CreatePipelineDTO,
  UpdatePipelineDTO,
  PipelineResponse,
  PipelineWithStagesResponse,
  PipelinesListResponse,
  PipelineFilters,
  CreatePipelineStageDTO,
  UpdatePipelineStageDTO,
  PipelineStageResponse,
  PipelineStagesListResponse,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import { safeEmitWebhookEvent } from '@/lib/events';

// ==================== HELPERS ====================

function formatPipeline(pipeline: IPipeline, stagesCount?: number): PipelineResponse {
  return {
    id: pipeline._id.toString(),
    name: pipeline.name,
    code: pipeline.code,
    description: pipeline.description,
    isDefault: pipeline.isDefault,
    isActive: pipeline.isActive,
    order: pipeline.order,
    stagesCount,
    createdAt: pipeline.createdAt,
    updatedAt: pipeline.updatedAt,
  };
}

function formatStage(stage: IPipelineStage): PipelineStageResponse {
  return {
    id: stage._id.toString(),
    pipelineId: stage.pipelineId.toString(),
    name: stage.name,
    code: stage.code,
    color: stage.color,
    order: stage.order,
    probability: stage.probability,
    isInitial: stage.isInitial,
    isFinal: stage.isFinal,
    isWon: stage.isWon,
    isActive: stage.isActive,
    createdAt: stage.createdAt,
    updatedAt: stage.updatedAt,
  };
}

// ==================== PIPELINE CRUD ====================

export async function getPipelines(filters: PipelineFilters = {}): Promise<PipelinesListResponse> {
  await dbConnect();

  const { search, isActive, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  if (search) {
    query.$text = { $search: search };
  }

  if (isActive !== undefined) {
    query.isActive = isActive;
  }

  const [pipelines, total] = await Promise.all([
    Pipeline.find(query).sort({ order: 1, name: 1 }).skip(skip).limit(limit),
    Pipeline.countDocuments(query),
  ]);

  // Get stages count for each pipeline
  const pipelineIds = pipelines.map((p) => p._id);
  const stagesCounts = await PipelineStage.aggregate([
    { $match: { pipelineId: { $in: pipelineIds } } },
    { $group: { _id: '$pipelineId', count: { $sum: 1 } } },
  ]);

  const countsMap = new Map(stagesCounts.map((s) => [s._id.toString(), s.count]));

  return {
    pipelines: pipelines.map((p) => formatPipeline(p, countsMap.get(p._id.toString()) || 0)),
    total,
  };
}

export async function getPipelineById(id: string): Promise<PipelineWithStagesResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const pipeline = await Pipeline.findById(id);
  if (!pipeline) {
    return null;
  }

  const stages = await PipelineStage.find({ pipelineId: pipeline._id }).sort({ order: 1 });

  return {
    ...formatPipeline(pipeline, stages.length),
    stages: stages.map(formatStage),
  };
}

export async function getPipelineByCode(code: string): Promise<PipelineWithStagesResponse | null> {
  await dbConnect();

  const pipeline = await Pipeline.findOne({ code: code.toLowerCase() });
  if (!pipeline) {
    return null;
  }

  const stages = await PipelineStage.find({ pipelineId: pipeline._id }).sort({ order: 1 });

  return {
    ...formatPipeline(pipeline, stages.length),
    stages: stages.map(formatStage),
  };
}

export async function getDefaultPipeline(): Promise<PipelineWithStagesResponse | null> {
  await dbConnect();

  const pipeline = await Pipeline.findOne({ isDefault: true, isActive: true });
  if (!pipeline) {
    // Fallback to first active pipeline
    const firstPipeline = await Pipeline.findOne({ isActive: true }).sort({ order: 1 });
    if (!firstPipeline) return null;

    const stages = await PipelineStage.find({ pipelineId: firstPipeline._id }).sort({ order: 1 });
    return {
      ...formatPipeline(firstPipeline, stages.length),
      stages: stages.map(formatStage),
    };
  }

  const stages = await PipelineStage.find({ pipelineId: pipeline._id }).sort({ order: 1 });

  return {
    ...formatPipeline(pipeline, stages.length),
    stages: stages.map(formatStage),
  };
}

export async function createPipeline(data: CreatePipelineDTO): Promise<PipelineResponse> {
  await dbConnect();

  // Get max order if not provided
  if (data.order === undefined) {
    const maxOrder = await Pipeline.findOne().sort({ order: -1 }).select('order');
    data.order = (maxOrder?.order ?? -1) + 1;
  }

  // If this pipeline is marked as default, unset other defaults
  if (data.isDefault) {
    await Pipeline.updateMany({ isDefault: true }, { isDefault: false });
  }

  const pipeline = new Pipeline(data);
  await pipeline.save();

  const response = formatPipeline(pipeline, 0);

  // Emit webhook event
  safeEmitWebhookEvent('pipeline', 'created', response);

  return response;
}

export async function updatePipeline(
  id: string,
  data: UpdatePipelineDTO
): Promise<PipelineResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  // Handle null values for optional fields
  const updateData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null) {
      updateData[key] = undefined;
    } else if (value !== undefined) {
      updateData[key] = value;
    }
  }

  // If setting as default, unset other defaults first
  if (updateData.isDefault === true) {
    await Pipeline.updateMany({ _id: { $ne: id }, isDefault: true }, { isDefault: false });
  }

  const pipeline = await Pipeline.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

  if (!pipeline) {
    return null;
  }

  const stagesCount = await PipelineStage.countDocuments({ pipelineId: pipeline._id });
  const response = formatPipeline(pipeline, stagesCount);

  // Emit webhook event
  safeEmitWebhookEvent('pipeline', 'updated', response);

  return response;
}

export async function deletePipeline(id: string): Promise<boolean> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete all stages first
    await PipelineStage.deleteMany({ pipelineId: id }, { session });

    // Delete pipeline
    const result = await Pipeline.findByIdAndDelete(id, { session });

    await session.commitTransaction();

    if (result) {
      // Emit webhook event
      safeEmitWebhookEvent('pipeline', 'deleted', { id });
    }

    return !!result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// ==================== PIPELINE STAGE CRUD ====================

export async function getStagesByPipelineId(pipelineId: string): Promise<PipelineStagesListResponse> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(pipelineId)) {
    return { stages: [], total: 0 };
  }

  const stages = await PipelineStage.find({ pipelineId }).sort({ order: 1 });

  return {
    stages: stages.map(formatStage),
    total: stages.length,
  };
}

export async function getStageById(stageId: string): Promise<PipelineStageResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(stageId)) {
    return null;
  }

  const stage = await PipelineStage.findById(stageId);
  if (!stage) {
    return null;
  }

  return formatStage(stage);
}

export async function createStage(
  pipelineId: string,
  data: CreatePipelineStageDTO
): Promise<PipelineStageResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(pipelineId)) {
    return null;
  }

  // Verify pipeline exists
  const pipeline = await Pipeline.findById(pipelineId);
  if (!pipeline) {
    return null;
  }

  // Get max order if not provided
  if (data.order === undefined) {
    const maxOrder = await PipelineStage.findOne({ pipelineId }).sort({ order: -1 }).select('order');
    data.order = (maxOrder?.order ?? -1) + 1;
  }

  // If this stage is marked as initial, unset other initial stages in same pipeline
  if (data.isInitial) {
    await PipelineStage.updateMany({ pipelineId, isInitial: true }, { isInitial: false });
  }

  const stage = new PipelineStage({
    ...data,
    pipelineId,
  });

  await stage.save();

  return formatStage(stage);
}

export async function updateStage(
  stageId: string,
  data: UpdatePipelineStageDTO
): Promise<PipelineStageResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(stageId)) {
    return null;
  }

  // If setting as initial, unset other initial stages in same pipeline first
  if (data.isInitial === true) {
    const existingStage = await PipelineStage.findById(stageId);
    if (existingStage) {
      await PipelineStage.updateMany(
        { pipelineId: existingStage.pipelineId, _id: { $ne: stageId }, isInitial: true },
        { isInitial: false }
      );
    }
  }

  const stage = await PipelineStage.findByIdAndUpdate(stageId, data, { new: true, runValidators: true });

  if (!stage) {
    return null;
  }

  return formatStage(stage);
}

export async function deleteStage(stageId: string): Promise<boolean> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(stageId)) {
    return false;
  }

  const result = await PipelineStage.findByIdAndDelete(stageId);
  return !!result;
}

export async function reorderStages(pipelineId: string, stageIds: string[]): Promise<boolean> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(pipelineId)) {
    return false;
  }

  try {
    const updatePromises = stageIds.map((stageId, index) =>
      PipelineStage.findOneAndUpdate(
        { _id: stageId, pipelineId },
        { order: index }
      )
    );

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error in reorderStages:', error);
    throw error;
  }
}

// ==================== UTILITY ====================

export async function getInitialStage(pipelineId: string): Promise<PipelineStageResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(pipelineId)) {
    return null;
  }

  // Try to find initial stage
  let stage = await PipelineStage.findOne({ pipelineId, isInitial: true, isActive: true });

  // Fallback to first stage by order
  if (!stage) {
    stage = await PipelineStage.findOne({ pipelineId, isActive: true }).sort({ order: 1 });
  }

  if (!stage) {
    return null;
  }

  return formatStage(stage);
}

export async function reorderPipelines(pipelineIds: string[]): Promise<boolean> {
  await dbConnect();

  try {
    const updatePromises = pipelineIds.map((pipelineId, index) => {
      if (!mongoose.Types.ObjectId.isValid(pipelineId)) {
        throw new Error(`Invalid pipeline ID: ${pipelineId}`);
      }
      return Pipeline.findByIdAndUpdate(pipelineId, { order: index });
    });

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error in reorderPipelines:', error);
    throw error;
  }
}
