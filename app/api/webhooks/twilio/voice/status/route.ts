import { NextRequest, NextResponse } from 'next/server';
import { getUserPhoneLineByNumber, incrementCallCount } from '@/modules/phone-line';
import { findMatchingRule, incrementTriggeredCount } from '@/modules/routing-rule';
import { TwilioAdapter } from '@/modules/provider/adapters';

export async function POST(request: NextRequest) {
  try {
    const adapter = new TwilioAdapter();
    await adapter.initialize({});

    const event = await adapter.parseWebhook(request.clone());

    if (!event || !('callId' in event)) {
      return new NextResponse('Invalid webhook', { status: 400 });
    }

    const callEvent = event;
    console.log('Call status update from Twilio:', callEvent.status, callEvent);

    // Find phone line
    const phoneLine = await getUserPhoneLineByNumber(callEvent.to);
    if (!phoneLine) {
      return new NextResponse('OK', { status: 200 });
    }

    // Update call statistics
    await incrementCallCount(phoneLine.id, 'inbound');

    // Handle no-answer scenario
    if (callEvent.status === 'no-answer' || callEvent.status === 'busy') {
      // Find rule for this scenario
      const rule = await findMatchingRule(phoneLine.id, {
        isNoAnswer: callEvent.status === 'no-answer',
        isBusy: callEvent.status === 'busy',
      });

      if (rule) {
        await incrementTriggeredCount(rule.id);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

        // Check action type
        if (rule.action.type === 'voicemail') {
          return new NextResponse(
            adapter.generateVoicemailResponse({
              greeting: rule.action.voicemailGreeting,
              transcribe: rule.action.transcribeVoicemail,
              webhookUrl: `${baseUrl}/api/webhooks/twilio/voice/recording`,
            }),
            { headers: { 'Content-Type': 'text/xml' } }
          );
        }

        if (rule.action.type === 'forward_ai_agent' && rule.action.aiProviderId) {
          // Redirect to AI agent - simplified for status webhook
          return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${baseUrl}/api/webhooks/twilio/voice</Redirect>
</Response>`,
            { headers: { 'Content-Type': 'text/xml' } }
          );
        }
      }

      // Default: voicemail
      return new NextResponse(
        adapter.generateVoicemailResponse({
          greeting: 'Абонент недоступен. Оставьте сообщение после сигнала.',
          webhookUrl: `${baseUrl}/api/webhooks/twilio/voice/recording`,
        }),
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Call completed - just acknowledge
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error handling Twilio status webhook:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
