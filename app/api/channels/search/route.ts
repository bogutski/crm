import { NextRequest, NextResponse } from 'next/server';
import { getChannels } from '@/modules/channel';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const includeInactive = body.includeInactive === true;

    const result = await getChannels(includeInactive);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching channels:', error);
    return NextResponse.json(
      { error: 'Failed to search channels' },
      { status: 500 }
    );
  }
}
