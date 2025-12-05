import { NextRequest, NextResponse } from 'next/server';
import { getPipelineById } from '@/modules/pipeline';
import { getOpportunities } from '@/modules/opportunity';
import { apiAuth } from '@/lib/api-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/pipelines/:id/analytics
 * Get pipeline analytics: opportunities count and amounts by stage
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const pipeline = await getPipelineById(id);
    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    const opportunities = await getOpportunities({ pipelineId: id, limit: 1000, page: 1 });

    const stageStats = pipeline.stages.map((stage) => {
      const stageOpps = opportunities.opportunities.filter((o) => o.stage?.id === stage.id);
      const totalAmount = stageOpps.reduce((sum, o) => sum + (o.amount || 0), 0);
      return {
        id: stage.id,
        name: stage.name,
        count: stageOpps.length,
        totalAmount,
        avgAmount: stageOpps.length > 0 ? totalAmount / stageOpps.length : 0,
      };
    });

    return NextResponse.json({
      pipeline: {
        id: pipeline.id,
        name: pipeline.name,
      },
      stages: stageStats,
      totalOpportunities: opportunities.total,
    });
  } catch (error) {
    console.error('Error fetching pipeline analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline analytics' },
      { status: 500 }
    );
  }
}
