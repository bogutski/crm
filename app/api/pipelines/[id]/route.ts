import { NextRequest, NextResponse } from 'next/server';
import { getPipelineById, updatePipeline, deletePipeline, updatePipelineSchema } from '@/modules/pipeline';
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
    const pipeline = await getPipelineById(id);

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    return NextResponse.json(pipeline);
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updatePipelineSchema.parse(body);

    const pipeline = await updatePipeline(id, data);

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    return NextResponse.json(pipeline);
  } catch (error) {
    console.error('Error updating pipeline:', error);
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Pipeline with this code already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update pipeline' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deletePipeline(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to delete pipeline' },
      { status: 500 }
    );
  }
}
