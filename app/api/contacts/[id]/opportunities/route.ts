import { NextRequest, NextResponse } from 'next/server';
import { getOpportunitiesByContact } from '@/modules/opportunity';
import { apiAuth } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const opportunities = await getOpportunitiesByContact(id);

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching contact opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}
