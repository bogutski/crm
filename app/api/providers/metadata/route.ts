import { NextRequest, NextResponse } from 'next/server';
import { PROVIDER_METADATA } from '@/modules/provider';
import { apiAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(PROVIDER_METADATA);
  } catch (error) {
    console.error('Error getting provider metadata:', error);
    return NextResponse.json(
      { error: 'Failed to get provider metadata' },
      { status: 500 }
    );
  }
}
