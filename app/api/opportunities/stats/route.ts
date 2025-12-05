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

    const result = await getOpportunities({ pipelineId, limit: 10000, page: 1 });

    const stats = {
      total: result.total,
      totalAmount: result.totalAmount || 0,
      byStage: {} as Record<string, { count: number; amount: number; isWon?: boolean }>,
      byOwner: {} as Record<string, {
        ownerId: string;
        ownerName: string;
        total: number;
        totalAmount: number;
        won: number;
        wonAmount: number;
      }>,
    };

    for (const opp of result.opportunities) {
      // Группировка по стадиям
      const stageName = opp.stage?.name || 'Без стадии';
      if (!stats.byStage[stageName]) {
        stats.byStage[stageName] = { count: 0, amount: 0, isWon: opp.stage?.isWon };
      }
      stats.byStage[stageName].count++;
      stats.byStage[stageName].amount += opp.amount || 0;

      // Группировка по ответственным
      const ownerKey = opp.owner?.id || 'no_owner';
      const ownerName = opp.owner?.name || 'Без ответственного';
      if (!stats.byOwner[ownerKey]) {
        stats.byOwner[ownerKey] = {
          ownerId: opp.owner?.id || '',
          ownerName,
          total: 0,
          totalAmount: 0,
          won: 0,
          wonAmount: 0,
        };
      }
      stats.byOwner[ownerKey].total++;
      stats.byOwner[ownerKey].totalAmount += opp.amount || 0;

      // Считаем выигранные сделки
      if (opp.stage?.isWon) {
        stats.byOwner[ownerKey].won++;
        stats.byOwner[ownerKey].wonAmount += opp.amount || 0;
      }
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
