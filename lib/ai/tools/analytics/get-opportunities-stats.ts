import mongoose from 'mongoose';
import Opportunity from '@/modules/opportunity/model';
import { PipelineStage } from '@/modules/pipeline/model';
import { getDefaultPipeline, getPipelineById } from '@/modules/pipeline/controller';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import { GetOpportunitiesStatsParams } from '../types';

export async function getOpportunitiesStats(params: GetOpportunitiesStatsParams) {
  await dbConnect();

  const { pipelineId, includeArchived, dateFrom, dateTo } = params;

  // Get pipeline info
  let pipeline;
  if (pipelineId) {
    pipeline = await getPipelineById(pipelineId);
  } else {
    pipeline = await getDefaultPipeline();
  }

  if (!pipeline) {
    return {
      success: false,
      error: 'Воронка не найдена',
    };
  }

  // Build match query
  const matchQuery: Record<string, unknown> = {
    pipelineId: new mongoose.Types.ObjectId(pipeline.id),
  };

  if (!includeArchived) {
    matchQuery.archived = { $ne: true };
  }

  if (dateFrom || dateTo) {
    matchQuery.createdAt = {};
    if (dateFrom) {
      (matchQuery.createdAt as Record<string, Date>).$gte = new Date(dateFrom);
    }
    if (dateTo) {
      (matchQuery.createdAt as Record<string, Date>).$lte = new Date(dateTo);
    }
  }

  // Aggregate stats
  const stats = await Opportunity.aggregate([
    { $match: matchQuery },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
              avgAmount: { $avg: '$amount' },
            },
          },
        ],
        byStage: [
          {
            $group: {
              _id: '$stageId',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
            },
          },
        ],
        byMonth: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
            },
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 6 },
        ],
        closingSoon: [
          {
            $match: {
              closingDate: {
                $gte: new Date(),
                $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
              },
            },
          },
          { $count: 'count' },
        ],
      },
    },
  ]);

  const result = stats[0];
  const totals = result.totals[0] || { count: 0, totalAmount: 0, avgAmount: 0 };

  // Map stage stats with names
  const stageStats = await Promise.all(
    result.byStage.map(async (stageStat: { _id: mongoose.Types.ObjectId; count: number; totalAmount: number }) => {
      const stage = await PipelineStage.findById(stageStat._id).select('name order color');
      return {
        stageId: stageStat._id.toString(),
        stageName: stage?.name || 'Неизвестно',
        stageOrder: stage?.order || 0,
        color: stage?.color,
        count: stageStat.count,
        totalAmount: stageStat.totalAmount,
      };
    })
  );

  // Sort by stage order
  stageStats.sort((a, b) => a.stageOrder - b.stageOrder);

  return {
    success: true,
    pipeline: {
      id: pipeline.id,
      name: pipeline.name,
    },
    summary: {
      totalOpportunities: totals.count,
      totalAmount: Math.round(totals.totalAmount),
      averageAmount: Math.round(totals.avgAmount || 0),
      closingThisWeek: result.closingSoon[0]?.count || 0,
    },
    byStage: stageStats.map((s) => ({
      stageName: s.stageName,
      color: s.color,
      count: s.count,
      totalAmount: Math.round(s.totalAmount),
    })),
    trend: result.byMonth.reverse().map((m: { _id: { year: number; month: number }; count: number; totalAmount: number }) => ({
      period: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
      count: m.count,
      totalAmount: Math.round(m.totalAmount),
    })),
  };
}
