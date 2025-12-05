import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createTask, createTaskSchema } from '@/modules/task';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    console.log('[Tasks API] POST authResult:', authResult);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTaskSchema.parse(body);

    // Get ownerId from session, internal auth, or undefined for API token
    const ownerId = authResult.userId;
    console.log('[Tasks API] Creating task with ownerId:', ownerId);

    if (!ownerId) {
      return NextResponse.json({ error: 'User ID is required to create a task' }, { status: 400 });
    }

    const task = await createTask({
      ...data,
      ownerId,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);

    // Возвращаем детальное сообщение об ошибке
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return NextResponse.json(
        { error: `Validation error: ${messages}` },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
