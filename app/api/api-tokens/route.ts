import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import { createApiToken, createApiTokenSchema } from '@/modules/api-token';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createApiTokenSchema.parse(body);

    const token = await createApiToken(data);
    return NextResponse.json(token, { status: 201 });
  } catch (error) {
    console.error('Error creating API token:', error);
    return NextResponse.json(
      { error: 'Failed to create API token' },
      { status: 500 }
    );
  }
}
