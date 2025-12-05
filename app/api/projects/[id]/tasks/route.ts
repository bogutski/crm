import { NextRequest, NextResponse } from 'next/server';
import { getTasksByEntity } from '@/modules/task';
import { apiAuth } from '@/lib/api-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/:id/tasks
 * Get all tasks linked to a project
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const tasks = await getTasksByEntity('project', id);

    return NextResponse.json({
      tasks,
      total: tasks.length,
    });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project tasks' },
      { status: 500 }
    );
  }
}
