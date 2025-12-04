import { NextRequest, NextResponse } from 'next/server';
import {
  createChannelProvider,
  createChannelProviderSchema,
} from '@/modules/provider';
import { apiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiAuth(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createChannelProviderSchema.parse(body);

    const provider = await createChannelProvider(data);
    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Error creating provider:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    );
  }
}
