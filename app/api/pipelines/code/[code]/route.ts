import { NextRequest, NextResponse } from 'next/server';
import { getPipelineByCode } from '@/modules/pipeline';
import { apiAuth } from '@/lib/api-auth';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/pipelines/code/:code
 * Get pipeline by code with its stages
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await params;

    const pipeline = await getPipelineByCode(code);

    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pipeline);
  } catch (error) {
    console.error('Error fetching pipeline by code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline' },
      { status: 500 }
    );
  }
}
