import { NextRequest, NextResponse } from 'next/server';
import { getDefaultPipeline } from '@/modules/pipeline';
import { apiAuth } from '@/lib/api-auth';

/**
 * GET /api/pipelines/default
 * Get the default pipeline with its stages
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pipeline = await getDefaultPipeline();

    if (!pipeline) {
      return NextResponse.json(
        { error: 'No default pipeline found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pipeline);
  } catch (error) {
    console.error('Error fetching default pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch default pipeline' },
      { status: 500 }
    );
  }
}
