import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import { getWebhookLogs, webhookLogFiltersSchema } from '@/modules/webhook';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const filters = webhookLogFiltersSchema.parse(body);

    const result = await getWebhookLogs(id, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook logs' },
      { status: 500 }
    );
  }
}
