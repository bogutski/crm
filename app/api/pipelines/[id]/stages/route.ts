import { NextRequest, NextResponse } from 'next/server';
import { getStagesByPipelineId, createStage, createPipelineStageSchema } from '@/modules/pipeline';
import { apiAuth } from '@/lib/api-auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await getStagesByPipelineId(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = createPipelineStageSchema.parse(body);

    const stage = await createStage(id, data);

    if (!stage) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error('Error creating stage:', error);
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Stage with this code already exists in this pipeline' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create stage' },
      { status: 500 }
    );
  }
}
