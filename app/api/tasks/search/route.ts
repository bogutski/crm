import { NextRequest, NextResponse } from 'next/server';
import { getTasks, taskFiltersSchema } from '@/modules/task';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const filters = taskFiltersSchema.parse(body);

    const result = await getTasks(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to search tasks' },
      { status: 500 }
    );
  }
}
