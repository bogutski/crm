import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/user';
import Webhook from '@/modules/webhook/model';
import { testWebhook } from '@/lib/events/webhook-sender';
import { connectToDatabase } from '@/lib/mongodb';

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

    await connectToDatabase();
    const webhook = await Webhook.findById(id);

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const result = await testWebhook(webhook);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}
