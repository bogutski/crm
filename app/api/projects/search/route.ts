import { NextRequest, NextResponse } from 'next/server';
import { getProjects, projectFiltersSchema } from '@/modules/project';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const filters = projectFiltersSchema.parse(body);

    const result = await getProjects(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching projects:', error);
    return NextResponse.json(
      { error: 'Failed to search projects' },
      { status: 500 }
    );
  }
}
