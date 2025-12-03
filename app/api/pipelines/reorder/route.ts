import { NextRequest, NextResponse } from 'next/server';
import { reorderPipelines, reorderPipelinesSchema } from '@/modules/pipeline';
import { apiAuth } from '@/lib/api-auth';

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pipelineIds } = reorderPipelinesSchema.parse(body);

    const success = await reorderPipelines(pipelineIds);

    if (!success) {
      return NextResponse.json({ error: 'Failed to reorder pipelines' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to reorder pipelines' },
      { status: 500 }
    );
  }
}
