import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import { getApiTokens, apiTokenFiltersSchema } from '@/modules/api-token';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const filters = apiTokenFiltersSchema.parse(body);

    const result = await getApiTokens(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching API tokens:', error);
    return NextResponse.json(
      { error: 'Failed to search API tokens' },
      { status: 500 }
    );
  }
}
