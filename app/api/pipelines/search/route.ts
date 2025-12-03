import { NextRequest, NextResponse } from 'next/server';
import { getPipelines, pipelineFiltersSchema } from '@/modules/pipeline';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const filters = pipelineFiltersSchema.parse(body);

    const result = await getPipelines(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to search pipelines' },
      { status: 500 }
    );
  }
}
