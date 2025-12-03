import { NextRequest, NextResponse } from 'next/server';
import { createPipeline, getPipelines, createPipelineSchema, pipelineFiltersSchema } from '@/modules/pipeline';
import { apiAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = pipelineFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const result = await getPipelines(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipelines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createPipelineSchema.parse(body);

    const pipeline = await createPipeline(data);
    return NextResponse.json(pipeline, { status: 201 });
  } catch (error) {
    console.error('Error creating pipeline:', error);
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Pipeline with this code already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create pipeline' },
      { status: 500 }
    );
  }
}
