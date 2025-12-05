import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import { getWebhooks, webhookFiltersSchema } from '@/modules/webhook';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const filters = webhookFiltersSchema.parse(body);

    const result = await getWebhooks(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to search webhooks' },
      { status: 500 }
    );
  }
}
