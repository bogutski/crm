import { NextRequest, NextResponse } from 'next/server';
import { getInteractions, interactionFiltersSchema } from '@/modules/interaction';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { limit, offset, ...filters } = interactionFiltersSchema.parse(body);

    const result = await getInteractions(filters, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to search interactions' },
      { status: 500 }
    );
  }
}
