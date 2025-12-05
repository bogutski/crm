import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { apiAuth } from '@/lib/api-auth';
import { connectToDatabase } from '@/lib/mongodb';
import Opportunity from '@/modules/opportunity/model';
import Task from '@/modules/task/model';
import '@/modules/pipeline/model';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface StageStats {
  id: string;
  name: string;
  color: string;
  count: number;
  amount: number;
}

interface PipelineStats {
  id: string;
  name: string;
  total: number;
  totalAmount: number;
  stages: StageStats[];
}

interface OpportunityStats {
  total: number;
  totalAmount: number;
  byPipeline: PipelineStats[];
}

interface TaskStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
}

export interface UserStatsResponse {
  opportunities: OpportunityStats;
  tasks: TaskStats;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    await connectToDatabase();

    // Get opportunities stats by owner, grouped by pipeline and stage
    const opportunitiesAgg = await Opportunity.aggregate([
      { $match: { ownerId: userObjectId } },
      {
        $lookup: {
          from: 'pipelinestages',
          localField: 'stageId',
          foreignField: '_id',
          as: 'stage',
        },
      },
      { $unwind: { path: '$stage', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'pipelines',
          localField: 'pipelineId',
          foreignField: '_id',
          as: 'pipeline',
        },
      },
      { $unwind: { path: '$pipeline', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            pipelineId: '$pipelineId',
            stageId: '$stageId',
          },
          pipelineName: { $first: '$pipeline.name' },
          stageName: { $first: '$stage.name' },
          stageColor: { $first: '$stage.color' },
          stageOrder: { $first: '$stage.order' },
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } },
        },
      },
      { $sort: { 'stageOrder': 1 } },
    ]);

    const opportunityStats: OpportunityStats = {
      total: 0,
      totalAmount: 0,
      byPipeline: [],
    };

    // Group by pipeline
    const pipelineMap = new Map<string, PipelineStats>();

    for (const item of opportunitiesAgg) {
      opportunityStats.total += item.count;
      opportunityStats.totalAmount += item.amount;

      const pipelineId = item._id.pipelineId?.toString() || 'none';

      if (!pipelineMap.has(pipelineId)) {
        pipelineMap.set(pipelineId, {
          id: pipelineId,
          name: item.pipelineName || 'Без воронки',
          total: 0,
          totalAmount: 0,
          stages: [],
        });
      }

      const pipeline = pipelineMap.get(pipelineId)!;
      pipeline.total += item.count;
      pipeline.totalAmount += item.amount;
      pipeline.stages.push({
        id: item._id.stageId?.toString() || 'none',
        name: item.stageName || 'Без стадии',
        color: item.stageColor || '#71717a',
        count: item.count,
        amount: item.amount,
      });
    }

    opportunityStats.byPipeline = Array.from(pipelineMap.values());

    // Get tasks stats by owner
    const now = new Date();
    const [
      totalTasks,
      openTasks,
      inProgressTasks,
      completedTasks,
      cancelledTasks,
      overdueTasks,
    ] = await Promise.all([
      Task.countDocuments({ ownerId: userObjectId }),
      Task.countDocuments({ ownerId: userObjectId, status: 'open' }),
      Task.countDocuments({ ownerId: userObjectId, status: 'in_progress' }),
      Task.countDocuments({ ownerId: userObjectId, status: 'completed' }),
      Task.countDocuments({ ownerId: userObjectId, status: 'cancelled' }),
      Task.countDocuments({
        ownerId: userObjectId,
        status: { $nin: ['completed', 'cancelled'] },
        dueDate: { $lt: now },
      }),
    ]);

    const taskStats: TaskStats = {
      total: totalTasks,
      open: openTasks,
      inProgress: inProgressTasks,
      completed: completedTasks,
      cancelled: cancelledTasks,
      overdue: overdueTasks,
    };

    const response: UserStatsResponse = {
      opportunities: opportunityStats,
      tasks: taskStats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
