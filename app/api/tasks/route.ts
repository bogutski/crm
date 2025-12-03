import { NextRequest, NextResponse } from 'next/server';
import { createTask, createTaskSchema } from '@/modules/task';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTaskSchema.parse(body);

    const ownerId = authResult.type === 'session' ? authResult.userId : undefined;

    const task = await createTask({
      ...data,
      ownerId,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
