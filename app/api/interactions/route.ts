import { NextRequest, NextResponse } from 'next/server';
import { createInteraction, createInteractionSchema } from '@/modules/interaction';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createInteractionSchema.parse(body);

    const interaction = await createInteraction(data, authResult.userId);
    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    console.error('Error creating interaction:', error);
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    );
  }
}
