import { NextRequest, NextResponse } from 'next/server';
import { getInteractionsByContact } from '@/modules/interaction';
import { apiAuth } from '@/lib/api-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/contacts/:id/interactions
 * Get all interactions for a contact
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await getInteractionsByContact(id, limit, offset);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching contact interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact interactions' },
      { status: 500 }
    );
  }
}
