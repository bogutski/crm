import mongoose from 'mongoose';
import Opportunity from '@/modules/opportunity/model';
import { getDefaultPipeline, getPipelineById } from '@/modules/pipeline/controller';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import { GetPipelineAnalyticsParams } from '../types';

export async function getPipelineAnalytics(params: GetPipelineAnalyticsParams) {
  await dbConnect();

  const { pipelineId } = params;

  // Get pipeline with stages
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

  const pipelineObjectId = new mongoose.Types.ObjectId(pipeline.id);

  // Get opportunities stats by stage
  const stageStats = await Opportunity.aggregate([
    {
      $match: {
        pipelineId: pipelineObjectId,
        archived: { $ne: true },
      },
    },
    {
      $group: {
        _id: '$stageId',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
      },
    },
  ]);

  // Create stage map
  const stageStatsMap = new Map(
    stageStats.map((s) => [s._id?.toString(), s])
  );

  // Calculate conversion funnel
  const stages = pipeline.stages || [];
  let previousCount = 0;

  const funnel = stages.map((stage, index) => {
    const stats = stageStatsMap.get(stage.id) || { count: 0, totalAmount: 0, avgAmount: 0 };

    // For first stage, conversion is 100%
    // For others, it's relative to the first stage (top of funnel)
    const firstStageCount = stageStatsMap.get(stages[0]?.id)?.count || 0;
    const conversionFromTop = firstStageCount > 0
      ? Math.round((stats.count / firstStageCount) * 100)
      : 0;

    // Step conversion (from previous stage)
    const stepConversion = previousCount > 0
      ? Math.round((stats.count / previousCount) * 100)
      : (index === 0 ? 100 : 0);

    previousCount = stats.count;

    return {
      stageId: stage.id,
      stageName: stage.name,
      color: stage.color,
      order: stage.order,
      isFinal: stage.isFinal,
      isWon: stage.isWon,
      count: stats.count,
      totalAmount: Math.round(stats.totalAmount),
      avgAmount: Math.round(stats.avgAmount || 0),
      conversionFromTop,
      stepConversion,
    };
  });

  // Calculate total metrics
  const totalOpportunities = funnel.reduce((sum, s) => sum + s.count, 0);
  const totalAmount = funnel.reduce((sum, s) => sum + s.totalAmount, 0);

  // Won deals (from stages marked as won)
  const wonStages = funnel.filter((s) => s.isWon);
  const wonCount = wonStages.reduce((sum, s) => sum + s.count, 0);
  const wonAmount = wonStages.reduce((sum, s) => sum + s.totalAmount, 0);

  // Overall win rate
  const winRate = totalOpportunities > 0
    ? Math.round((wonCount / totalOpportunities) * 100)
    : 0;

  return {
    success: true,
    pipeline: {
      id: pipeline.id,
      name: pipeline.name,
      stagesCount: stages.length,
    },
    summary: {
      totalOpportunities,
      totalAmount,
      wonCount,
      wonAmount,
      winRate,
      avgDealSize: totalOpportunities > 0 ? Math.round(totalAmount / totalOpportunities) : 0,
    },
    funnel,
  };
}
