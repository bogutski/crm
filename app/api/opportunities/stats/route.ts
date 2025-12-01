import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import { getOpportunityStats } from '@/modules/opportunity';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId') || undefined;

    const stats = await getOpportunityStats(ownerId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching opportunity stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunity stats' },
      { status: 500 }
    );
  }
}
