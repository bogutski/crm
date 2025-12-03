import mongoose from 'mongoose';
import Opportunity, { IOpportunity } from './model';
import {
  CreateOpportunityDTO,
  UpdateOpportunityDTO,
  OpportunityResponse,
  OpportunitiesListResponse,
  OpportunityFilters,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
// Import models for mongoose to register them before populate
import '@/modules/dictionary/model';
import '@/modules/contact/model';
import '@/modules/user/model';
import '@/modules/pipeline/model';

interface PopulatedOpportunity extends Omit<IOpportunity, 'contact' | 'ownerId' | 'priority' | 'pipelineId' | 'stageId'> {
  contact?: {
    _id: { toString(): string };
    name: string;
  } | null;
  ownerId?: {
    _id: { toString(): string };
    name: string;
    email: string;
  } | null;
  priority?: {
    _id: { toString(): string };
    name: string;
    properties: { color?: string };
  } | null;
  pipelineId?: {
    _id: { toString(): string };
    name: string;
    code: string;
  } | null;
  stageId?: {
    _id: { toString(): string };
    name: string;
    color: string;
    order: number;
    probability: number;
    isInitial: boolean;
    isFinal: boolean;
    isWon: boolean;
  } | null;
}

function toOpportunityResponse(opp: PopulatedOpportunity): OpportunityResponse {
  return {
    id: opp._id.toString(),
    name: opp.name,
    amount: opp.amount,
    closingDate: opp.closingDate,
    utm: opp.utm,
    description: opp.description,
    externalId: opp.externalId,
    archived: opp.archived,
    contact: opp.contact ? {
      id: opp.contact._id.toString(),
      name: opp.contact.name,
    } : null,
    owner: opp.ownerId ? {
      id: opp.ownerId._id.toString(),
      name: opp.ownerId.name,
      email: opp.ownerId.email,
    } : null,
    priority: opp.priority ? {
      id: opp.priority._id.toString(),
      name: opp.priority.name,
      color: opp.priority.properties?.color,
    } : null,
    pipeline: opp.pipelineId ? {
      id: opp.pipelineId._id.toString(),
      name: opp.pipelineId.name,
      code: opp.pipelineId.code,
    } : null,
    stage: opp.stageId ? {
      id: opp.stageId._id.toString(),
      name: opp.stageId.name,
      color: opp.stageId.color,
      order: opp.stageId.order,
      probability: opp.stageId.probability,
      isInitial: opp.stageId.isInitial,
      isFinal: opp.stageId.isFinal,
      isWon: opp.stageId.isWon,
    } : null,
    createdAt: opp.createdAt,
    updatedAt: opp.updatedAt,
  };
}

export async function getOpportunities(
  filters: OpportunityFilters
): Promise<OpportunitiesListResponse> {
  await dbConnect();

  const {
    search,
    archived,
    ownerId,
    contactId,
    priorityId,
    pipelineId,
    stageId,
    minAmount,
    maxAmount,
    closingDateFrom,
    closingDateTo,
    page = 1,
    limit = 20,
  } = filters;

  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (archived !== undefined) {
    query.archived = archived;
  }

  if (ownerId) {
    query.ownerId = ownerId;
  }

  if (contactId) {
    query.contact = contactId;
  }

  if (priorityId) {
    query.priority = priorityId;
  }

  if (pipelineId && mongoose.Types.ObjectId.isValid(pipelineId)) {
    query.pipelineId = new mongoose.Types.ObjectId(pipelineId);
  }

  if (stageId && mongoose.Types.ObjectId.isValid(stageId)) {
    query.stageId = new mongoose.Types.ObjectId(stageId);
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    query.amount = {};
    if (minAmount !== undefined) {
      (query.amount as Record<string, number>).$gte = minAmount;
    }
    if (maxAmount !== undefined) {
      (query.amount as Record<string, number>).$lte = maxAmount;
    }
  }

  if (closingDateFrom || closingDateTo) {
    query.closingDate = {};
    if (closingDateFrom) {
      (query.closingDate as Record<string, Date>).$gte = new Date(closingDateFrom);
    }
    if (closingDateTo) {
      (query.closingDate as Record<string, Date>).$lte = new Date(closingDateTo);
    }
  }

  const skip = (page - 1) * limit;

  const [opportunities, total, aggregation] = await Promise.all([
    Opportunity.find(query)
      .populate('contact', 'name')
      .populate('ownerId', 'name email')
      .populate('priority', 'name properties')
      .populate('pipelineId', 'name code')
      .populate('stageId', 'name color order probability isInitial isFinal isWon')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Opportunity.countDocuments(query),
    Opportunity.aggregate([
      { $match: query },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]),
  ]);

  const totalAmount = aggregation[0]?.totalAmount || 0;

  return {
    opportunities: (opportunities as unknown as PopulatedOpportunity[]).map(toOpportunityResponse),
    total,
    totalAmount,
    page,
    limit,
  };
}

export async function getOpportunityById(id: string): Promise<OpportunityResponse | null> {
  await dbConnect();

  const opp = await Opportunity.findById(id)
    .populate('contact', 'name')
    .populate('ownerId', 'name email')
    .populate('priority', 'name properties')
    .populate('pipelineId', 'name code')
    .populate('stageId', 'name color order probability isInitial isFinal isWon')
    .lean();

  if (!opp) return null;

  return toOpportunityResponse(opp as unknown as PopulatedOpportunity);
}

export async function createOpportunity(
  data: CreateOpportunityDTO
): Promise<OpportunityResponse> {
  await dbConnect();

  const opp = await Opportunity.create({
    name: data.name,
    amount: data.amount,
    closingDate: data.closingDate,
    utm: data.utm,
    description: data.description,
    externalId: data.externalId,
    archived: data.archived ?? false,
    contact: data.contactId,
    ownerId: data.ownerId,
    priority: data.priorityId,
    pipelineId: data.pipelineId,
    stageId: data.stageId,
  });

  // Populate for response
  const populated = await Opportunity.findById(opp._id)
    .populate('contact', 'name')
    .populate('ownerId', 'name email')
    .populate('priority', 'name properties')
    .populate('pipelineId', 'name code')
    .populate('stageId', 'name color order probability isInitial isFinal isWon')
    .lean();

  return toOpportunityResponse(populated as unknown as PopulatedOpportunity);
}

export async function updateOpportunity(
  id: string,
  data: UpdateOpportunityDTO
): Promise<OpportunityResponse | null> {
  await dbConnect();

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.closingDate !== undefined) updateData.closingDate = data.closingDate;
  if (data.utm !== undefined) updateData.utm = data.utm;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.externalId !== undefined) updateData.externalId = data.externalId;
  if (data.archived !== undefined) updateData.archived = data.archived;
  if (data.contactId !== undefined) updateData.contact = data.contactId;
  if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;
  if (data.priorityId !== undefined) updateData.priority = data.priorityId;
  if (data.pipelineId !== undefined) updateData.pipelineId = data.pipelineId;
  if (data.stageId !== undefined) updateData.stageId = data.stageId;

  const opp = await Opportunity.findByIdAndUpdate(id, { $set: updateData }, { new: true })
    .populate('contact', 'name')
    .populate('ownerId', 'name email')
    .populate('priority', 'name properties')
    .populate('pipelineId', 'name code')
    .populate('stageId', 'name color order probability isInitial isFinal isWon')
    .lean();

  if (!opp) return null;

  return toOpportunityResponse(opp as unknown as PopulatedOpportunity);
}

export async function deleteOpportunity(id: string): Promise<boolean> {
  await dbConnect();

  const result = await Opportunity.findByIdAndDelete(id);
  return !!result;
}

export async function archiveOpportunity(
  id: string,
  archived: boolean = true
): Promise<OpportunityResponse | null> {
  await dbConnect();

  const opp = await Opportunity.findByIdAndUpdate(
    id,
    { $set: { archived } },
    { new: true }
  )
    .populate('contact', 'name')
    .populate('ownerId', 'name email')
    .populate('priority', 'name properties')
    .populate('pipelineId', 'name code')
    .populate('stageId', 'name color order probability isInitial isFinal isWon')
    .lean();

  if (!opp) return null;

  return toOpportunityResponse(opp as unknown as PopulatedOpportunity);
}

export async function getOpportunitiesByContact(
  contactId: string
): Promise<OpportunityResponse[]> {
  await dbConnect();

  const opportunities = await Opportunity.find({ contact: contactId })
    .populate('contact', 'name')
    .populate('ownerId', 'name email')
    .populate('priority', 'name properties')
    .populate('pipelineId', 'name code')
    .populate('stageId', 'name color order probability isInitial isFinal isWon')
    .sort({ createdAt: -1 })
    .lean();

  return (opportunities as unknown as PopulatedOpportunity[]).map(toOpportunityResponse);
}

export async function getOpportunitiesByOwner(
  ownerId: string
): Promise<OpportunityResponse[]> {
  await dbConnect();

  const opportunities = await Opportunity.find({ ownerId })
    .populate('contact', 'name')
    .populate('ownerId', 'name email')
    .populate('priority', 'name properties')
    .populate('pipelineId', 'name code')
    .populate('stageId', 'name color order probability isInitial isFinal isWon')
    .sort({ createdAt: -1 })
    .lean();

  return (opportunities as unknown as PopulatedOpportunity[]).map(toOpportunityResponse);
}

export async function getOpportunitiesByPipeline(
  pipelineId: string
): Promise<OpportunityResponse[]> {
  await dbConnect();

  const opportunities = await Opportunity.find({ pipelineId })
    .populate('contact', 'name')
    .populate('ownerId', 'name email')
    .populate('priority', 'name properties')
    .populate('pipelineId', 'name code')
    .populate('stageId', 'name color order probability isInitial isFinal isWon')
    .sort({ createdAt: -1 })
    .lean();

  return (opportunities as unknown as PopulatedOpportunity[]).map(toOpportunityResponse);
}

export async function getOpportunitiesByStage(
  stageId: string
): Promise<OpportunityResponse[]> {
  await dbConnect();

  const opportunities = await Opportunity.find({ stageId })
    .populate('contact', 'name')
    .populate('ownerId', 'name email')
    .populate('priority', 'name properties')
    .populate('pipelineId', 'name code')
    .populate('stageId', 'name color order probability isInitial isFinal isWon')
    .sort({ createdAt: -1 })
    .lean();

  return (opportunities as unknown as PopulatedOpportunity[]).map(toOpportunityResponse);
}

export async function moveOpportunityToStage(
  opportunityId: string,
  stageId: string,
  pipelineId?: string
): Promise<OpportunityResponse | null> {
  await dbConnect();

  const updateData: Record<string, unknown> = { stageId };
  if (pipelineId) {
    updateData.pipelineId = pipelineId;
  }

  const opp = await Opportunity.findByIdAndUpdate(
    opportunityId,
    { $set: updateData },
    { new: true }
  )
    .populate('contact', 'name')
    .populate('ownerId', 'name email')
    .populate('priority', 'name properties')
    .populate('pipelineId', 'name code')
    .populate('stageId', 'name color order probability isInitial isFinal isWon')
    .lean();

  if (!opp) return null;

  return toOpportunityResponse(opp as unknown as PopulatedOpportunity);
}
