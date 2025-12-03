import { NextRequest, NextResponse } from 'next/server';
import { getStageById, updateStage, deleteStage, updatePipelineStageSchema } from '@/modules/pipeline';
import { apiAuth } from '@/lib/api-auth';

interface Params {
  params: Promise<{ id: string; stageId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stageId } = await params;
    const stage = await getStageById(stageId);

    if (!stage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    return NextResponse.json(stage);
  } catch (error) {
    console.error('Error fetching stage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stage' },
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

    const { stageId } = await params;
    const body = await request.json();
    const data = updatePipelineStageSchema.parse(body);

    const stage = await updateStage(stageId, data);

    if (!stage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    return NextResponse.json(stage);
  } catch (error) {
    console.error('Error updating stage:', error);
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Stage with this code already exists in this pipeline' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update stage' },
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

    const { stageId } = await params;
    const deleted = await deleteStage(stageId);

    if (!deleted) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stage:', error);
    return NextResponse.json(
      { error: 'Failed to delete stage' },
      { status: 500 }
    );
  }
}
