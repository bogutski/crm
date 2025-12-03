import { NextRequest, NextResponse } from 'next/server';
import { getOpportunities, opportunityFiltersSchema } from '@/modules/opportunity';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const filters = opportunityFiltersSchema.parse(body);

    const result = await getOpportunities(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching opportunities:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to search opportunities', details: errorMessage },
      { status: 500 }
    );
  }
}
