import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsAdapter } from '@/modules/provider/adapters';

export async function POST(request: NextRequest) {
  try {
    const adapter = new ElevenLabsAdapter();
    await adapter.initialize({});

    const event = await adapter.parseWebhook(request.clone());

    if (!event) {
      // Not a conversation-ended event
      const body = await request.clone().json();
      console.log('ElevenLabs webhook (other):', body);
      return NextResponse.json({ status: 'ok' });
    }

    console.log('ElevenLabs conversation ended:', event);

    const { callId, assistantId, duration, endReason, summary, transcript, recordingUrl } = event;

    // TODO: Create interaction record in CRM
    // TODO: Send notification to manager
    // TODO: Create follow-up task if needed

    console.log('ElevenLabs call processed:', {
      callId,
      assistantId,
      duration,
      endReason,
      summary,
      recordingUrl,
      transcriptLength: transcript?.length || 0,
    });

    return NextResponse.json({ status: 'processed' });
  } catch (error) {
    console.error('Error handling ElevenLabs webhook:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
