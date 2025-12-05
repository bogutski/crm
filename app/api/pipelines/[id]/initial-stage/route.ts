import { NextRequest, NextResponse } from 'next/server';
import { getInitialStage } from '@/modules/pipeline';
import { apiAuth } from '@/lib/api-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/pipelines/:id/initial-stage
 * Get the initial stage of a pipeline
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const stage = await getInitialStage(id);

    if (!stage) {
      return NextResponse.json(
        { error: 'Initial stage not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stage);
  } catch (error) {
    console.error('Error fetching initial stage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch initial stage' },
      { status: 500 }
    );
  }
}
