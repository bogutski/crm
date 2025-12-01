import Opportunity, { IOpportunity, OpportunityStage } from './model';
import {
  CreateOpportunityDTO,
  UpdateOpportunityDTO,
  OpportunityResponse,
  OpportunitiesListResponse,
  OpportunityFilters,
  OpportunityStats,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';

function toOpportunityResponse(opp: IOpportunity): OpportunityResponse {
  return {
    id: opp._id.toString(),
    title: opp.title,
    description: opp.description,
    value: opp.value,
    currency: opp.currency,
    stage: opp.stage,
    priority: opp.priority,
    probability: opp.probability,
    expectedCloseDate: opp.expectedCloseDate,
    actualCloseDate: opp.actualCloseDate,
    contactId: opp.contactId?.toString(),
    ownerId: opp.ownerId.toString(),
    notes: opp.notes,
    tags: opp.tags,
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
    stage,
    priority,
    ownerId,
    contactId,
    minValue,
    maxValue,
    tags,
    page = 1,
    limit = 20,
  } = filters;

  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (stage) {
    query.stage = stage;
  }

  if (priority) {
    query.priority = priority;
  }

  if (ownerId) {
    query.ownerId = ownerId;
  }

  if (contactId) {
    query.contactId = contactId;
  }

  if (minValue !== undefined || maxValue !== undefined) {
    query.value = {};
    if (minValue !== undefined) {
      (query.value as Record<string, number>).$gte = minValue;
    }
    if (maxValue !== undefined) {
      (query.value as Record<string, number>).$lte = maxValue;
    }
  }

  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }

  const skip = (page - 1) * limit;

  const [opportunities, total] = await Promise.all([
    Opportunity.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Opportunity.countDocuments(query),
  ]);

  return {
    opportunities: opportunities.map(toOpportunityResponse),
    total,
    page,
    limit,
  };
}

export async function getOpportunityById(id: string): Promise<OpportunityResponse | null> {
  await dbConnect();

  const opp = await Opportunity.findById(id);
  if (!opp) return null;

  return toOpportunityResponse(opp);
}

export async function createOpportunity(
  data: CreateOpportunityDTO
): Promise<OpportunityResponse> {
  await dbConnect();

  const opp = await Opportunity.create({
    title: data.title,
    description: data.description,
    value: data.value,
    currency: data.currency || 'USD',
    stage: data.stage || 'prospecting',
    priority: data.priority || 'medium',
    probability: data.probability || 0,
    expectedCloseDate: data.expectedCloseDate,
    contactId: data.contactId,
    ownerId: data.ownerId,
    notes: data.notes,
    tags: data.tags || [],
  });

  return toOpportunityResponse(opp);
}

export async function updateOpportunity(
  id: string,
  data: UpdateOpportunityDTO
): Promise<OpportunityResponse | null> {
  await dbConnect();

  const opp = await Opportunity.findByIdAndUpdate(id, { $set: data }, { new: true });
  if (!opp) return null;

  return toOpportunityResponse(opp);
}

export async function deleteOpportunity(id: string): Promise<boolean> {
  await dbConnect();

  const result = await Opportunity.findByIdAndDelete(id);
  return !!result;
}

export async function updateOpportunityStage(
  id: string,
  stage: OpportunityStage
): Promise<OpportunityResponse | null> {
  await dbConnect();

  const updateData: Record<string, unknown> = { stage };

  if (stage === 'closed_won' || stage === 'closed_lost') {
    updateData.actualCloseDate = new Date();
  }

  const opp = await Opportunity.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  if (!opp) return null;

  return toOpportunityResponse(opp);
}

export async function getOpportunityStats(ownerId?: string): Promise<OpportunityStats> {
  await dbConnect();

  const matchStage: Record<string, unknown> = {};
  if (ownerId) {
    matchStage.ownerId = ownerId;
  }

  const stages: OpportunityStage[] = [
    'prospecting',
    'qualification',
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost',
  ];

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        value: { $sum: '$value' },
        avgProbability: { $avg: '$probability' },
      },
    },
  ];

  const results = await Opportunity.aggregate(pipeline);

  const byStage = stages.reduce(
    (acc, stage) => {
      acc[stage] = { count: 0, value: 0 };
      return acc;
    },
    {} as Record<OpportunityStage, { count: number; value: number }>
  );

  let totalValue = 0;
  let totalCount = 0;
  let totalProbability = 0;

  for (const result of results) {
    const stage = result._id as OpportunityStage;
    byStage[stage] = { count: result.count, value: result.value };
    totalValue += result.value;
    totalCount += result.count;
    totalProbability += result.avgProbability * result.count;
  }

  return {
    totalValue,
    totalCount,
    byStage,
    avgProbability: totalCount > 0 ? totalProbability / totalCount : 0,
  };
}

export async function getOpportunitiesByContact(
  contactId: string
): Promise<OpportunityResponse[]> {
  await dbConnect();

  const opportunities = await Opportunity.find({ contactId }).sort({ createdAt: -1 });
  return opportunities.map(toOpportunityResponse);
}
