import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import { createWebhook, createWebhookSchema } from '@/modules/webhook';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createWebhookSchema.parse(body);

    const webhook = await createWebhook(data);
    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
