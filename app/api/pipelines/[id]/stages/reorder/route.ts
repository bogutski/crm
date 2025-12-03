import { NextRequest, NextResponse } from 'next/server';
import { reorderStages, reorderStagesSchema } from '@/modules/pipeline';
import { apiAuth } from '@/lib/api-auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { stageIds } = reorderStagesSchema.parse(body);

    const success = await reorderStages(id, stageIds);

    if (!success) {
      return NextResponse.json({ error: 'Failed to reorder stages' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering stages:', error);
    return NextResponse.json(
      { error: 'Failed to reorder stages' },
      { status: 500 }
    );
  }
}
