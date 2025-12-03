import { NextRequest, NextResponse } from 'next/server';
import { getContacts, contactFiltersSchema } from '@/modules/contact';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const filters = contactFiltersSchema.parse(body);

    const result = await getContacts(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to search contacts' },
      { status: 500 }
    );
  }
}
