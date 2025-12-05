import { NextRequest, NextResponse } from 'next/server';
import { getOpportunities } from '@/modules/opportunity';
import { apiAuth } from '@/lib/api-auth';

/**
 * GET /api/opportunities/stats
 * Get opportunities statistics: total count, total amount, breakdown by stage
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId') || undefined;

    const result = await getOpportunities({ pipelineId, limit: 1000, page: 1 });

    const stats = {
      total: result.total,
      totalAmount: result.totalAmount || 0,
      byStage: {} as Record<string, { count: number; amount: number }>,
    };

    for (const opp of result.opportunities) {
      const stageName = opp.stage?.name || 'Без стадии';
      if (!stats.byStage[stageName]) {
        stats.byStage[stageName] = { count: 0, amount: 0 };
      }
      stats.byStage[stageName].count++;
      stats.byStage[stageName].amount += opp.amount || 0;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching opportunities stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities stats' },
      { status: 500 }
    );
  }
}
