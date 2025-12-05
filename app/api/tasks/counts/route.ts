import { NextRequest, NextResponse } from 'next/server';
import { getTaskStatusCounts } from '@/modules/task';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const counts = await getTaskStatusCounts({
      search: body.search,
      priorityId: body.priorityId,
      assigneeId: body.assigneeId,
      ownerId: body.ownerId,
      entityType: body.entityType,
      entityId: body.entityId,
      dueDateFrom: body.dueDateFrom,
      dueDateTo: body.dueDateTo,
    });

    return NextResponse.json(counts);
  } catch (error) {
    console.error('Error fetching task counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task counts' },
      { status: 500 }
    );
  }
}
