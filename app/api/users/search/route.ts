import { NextRequest, NextResponse } from 'next/server';
import { getUsers, userFiltersSchema } from '@/modules/user';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const filters = userFiltersSchema.parse(body);

    const result = await getUsers(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
