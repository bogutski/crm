import { NextRequest, NextResponse } from 'next/server';
import {
  getChannelProviders,
  searchChannelProvidersSchema,
} from '@/modules/provider';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const options = searchChannelProvidersSchema.parse(body);

    const result = await getChannelProviders(options);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching providers:', error);
    return NextResponse.json(
      { error: 'Failed to search providers' },
      { status: 500 }
    );
  }
}
