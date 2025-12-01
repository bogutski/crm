import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import {
  getOpportunities,
  createOpportunity,
  createOpportunitySchema,
  opportunityFiltersSchema,
} from '@/modules/opportunity';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = opportunityFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      stage: searchParams.get('stage') || undefined,
      priority: searchParams.get('priority') || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
      contactId: searchParams.get('contactId') || undefined,
      minValue: searchParams.get('minValue') || undefined,
      maxValue: searchParams.get('maxValue') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const result = await getOpportunities(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createOpportunitySchema.parse(body);

    const opportunity = await createOpportunity({
      ...data,
      ownerId: session.user.id,
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
