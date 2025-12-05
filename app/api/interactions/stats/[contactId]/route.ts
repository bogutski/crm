import { NextRequest, NextResponse } from 'next/server';
import { getInteractionStats } from '@/modules/interaction';
import { apiAuth } from '@/lib/api-auth';

interface RouteParams {
  params: Promise<{ contactId: string }>;
}

/**
 * GET /api/interactions/stats/:contactId
 * Get interaction statistics for a contact
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contactId } = await params;

    const stats = await getInteractionStats(contactId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching interaction stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interaction stats' },
      { status: 500 }
    );
  }
}
