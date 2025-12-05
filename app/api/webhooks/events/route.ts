import { NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import { getAvailableEvents } from '@/modules/webhook';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = getAvailableEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook events' },
      { status: 500 }
    );
  }
}
