import { NextRequest, NextResponse } from 'next/server';
import { createOpportunity, createOpportunitySchema } from '@/modules/opportunity';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createOpportunitySchema.parse(body);

    const ownerId = authResult.type === 'session' ? authResult.userId : undefined;

    const opportunity = await createOpportunity({
      ...data,
      ownerId,
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to create opportunity' },
      { status: 500 }
    );
  }
}
