import { NextRequest, NextResponse } from 'next/server';
import { createProject, createProjectSchema } from '@/modules/project';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createProjectSchema.parse(body);

    const ownerId = authResult.type === 'session' ? authResult.userId : undefined;

    const project = await createProject({
      ...data,
      ownerId,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
