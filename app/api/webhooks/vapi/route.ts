import { NextRequest, NextResponse } from 'next/server';
import { VAPIAdapter } from '@/modules/provider/adapters';
import { getUserPhoneLineByNumber } from '@/modules/phone-line';

export async function POST(request: NextRequest) {
  try {
    const adapter = new VAPIAdapter();
    await adapter.initialize({});

    const event = await adapter.parseWebhook(request.clone());

    if (!event) {
      // Not a call-ended event, might be other webhook type
      const body = await request.clone().json();
      console.log('VAPI webhook (non-call-ended):', body);
      return NextResponse.json({ status: 'ok' });
    }

    console.log('VAPI call ended:', event);

    // Process the call ended event
    const { callId, assistantId, duration, endReason, summary, transcript, recordingUrl } = event;

    // TODO: Create interaction record in CRM
    // TODO: Send notification to manager
    // TODO: Create follow-up task if needed

    console.log('VAPI call processed:', {
      callId,
      assistantId,
      duration,
      endReason,
      summary,
      recordingUrl,
      transcriptLength: transcript?.length || 0,
    });

    // If the call was transferred, we might need to do additional handling
    if (endReason === 'transferred') {
      console.log('Call was transferred to human agent');
    }

    // If there's urgency detected in the conversation
    if (event.metadata?.urgency === 'high') {
      // TODO: Create high-priority task
      console.log('High urgency detected, creating priority task');
    }

    return NextResponse.json({ status: 'processed' });
  } catch (error) {
    console.error('Error handling VAPI webhook:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
