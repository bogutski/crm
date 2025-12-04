import { NextRequest, NextResponse } from 'next/server';
import { getUserPhoneLineByNumber } from '@/modules/phone-line';
import { findMatchingRule, incrementTriggeredCount } from '@/modules/routing-rule';
import { getProviderConfig, getProvidersForRouting } from '@/modules/provider';
import {
  createTelephonyAdapter,
  createAIAgentAdapter,
  TwilioAdapter,
} from '@/modules/provider/adapters';

export async function POST(request: NextRequest) {
  try {
    // Parse Twilio webhook
    const adapter = new TwilioAdapter();
    await adapter.initialize({});

    const event = await adapter.parseWebhook(request.clone());

    if (!event || !('callId' in event)) {
      return new NextResponse('Invalid webhook', { status: 400 });
    }

    const callEvent = event;
    console.log('Incoming call from Twilio:', callEvent);

    // Find phone line by the "to" number
    const phoneLine = await getUserPhoneLineByNumber(callEvent.to);

    if (!phoneLine) {
      // Unknown number - return default response
      console.log('Phone line not found for:', callEvent.to);
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="ru-RU">Номер не найден в системе. До свидания.</Say>
  <Hangup/>
</Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Find matching routing rule
    const rule = await findMatchingRule(phoneLine.id, {
      isNoAnswer: callEvent.status === 'no-answer',
      isBusy: callEvent.status === 'busy',
      isOffline: false, // TODO: Check manager online status
      isVIP: false, // TODO: Check if caller is VIP
      isNewCaller: true, // TODO: Check if caller is known
    });

    if (!rule) {
      // No rule matched - ring the owner
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      return new NextResponse(
        adapter.generateRingingResponse({
          timeout: 30,
          webhookUrl: `${baseUrl}/api/webhooks/twilio/voice/status`,
        }),
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Increment rule trigger count
    await incrementTriggeredCount(rule.id);

    // Execute action based on rule
    const twiml = await executeRuleAction(rule, phoneLine, callEvent, adapter);

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error handling Twilio voice webhook:', error);

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="ru-RU">Произошла ошибка. Попробуйте позвонить позже.</Say>
  <Hangup/>
</Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }
}

async function executeRuleAction(
  rule: Awaited<ReturnType<typeof findMatchingRule>>,
  phoneLine: Awaited<ReturnType<typeof getUserPhoneLineByNumber>>,
  callEvent: { callId: string; from: string; to: string },
  adapter: TwilioAdapter
): Promise<string> {
  if (!rule || !phoneLine) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="ru-RU">Ошибка маршрутизации.</Say>
  <Hangup/>
</Response>`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const action = rule.action;

  switch (action.type) {
    case 'forward_number':
      if (action.targetNumber) {
        return adapter.generateForwardResponse({
          to: action.targetNumber,
          callerId: callEvent.from,
          timeout: 30,
        });
      }
      break;

    case 'forward_ai_agent':
      if (action.aiProviderId) {
        try {
          // Get AI provider config
          const config = await getProviderConfig(action.aiProviderId);
          if (!config) {
            throw new Error('AI provider config not found');
          }

          // Get providers to determine type
          const providers = await getProvidersForRouting(
            phoneLine.providerId,
            'ai_agent'
          );
          const aiProvider = providers.find(p => p.id === action.aiProviderId);

          if (!aiProvider) {
            throw new Error('AI provider not found');
          }

          // Create AI agent adapter
          const aiAdapter = await createAIAgentAdapter(
            aiProvider.type as 'vapi' | 'elevenlabs',
            config as Record<string, unknown>
          );

          // Get SIP URI
          const sipUri = await aiAdapter.getSipUri({
            assistantId: action.aiAssistantId,
            context: {
              reason: rule.condition === 'after_hours' ? 'after_hours' :
                     rule.condition === 'no_answer' ? 'no_answer' :
                     rule.condition === 'busy' ? 'busy' : undefined,
            },
          });

          // Transfer to SIP
          return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Sip>${sipUri}</Sip>
  </Dial>
</Response>`;
        } catch (error) {
          console.error('Error forwarding to AI agent:', error);
          // Fallback to voicemail
          return adapter.generateVoicemailResponse({
            greeting: 'Ассистент недоступен. Оставьте сообщение после сигнала.',
            webhookUrl: `${baseUrl}/api/webhooks/twilio/voice/recording`,
          });
        }
      }
      break;

    case 'voicemail':
      return adapter.generateVoicemailResponse({
        greeting: action.voicemailGreeting,
        transcribe: action.transcribeVoicemail,
        webhookUrl: `${baseUrl}/api/webhooks/twilio/voice/recording`,
      });

    case 'play_message':
      if (action.messageUrl) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${action.messageUrl}</Play>
  <Hangup/>
</Response>`;
      } else if (action.messageText) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="ru-RU">${action.messageText}</Say>
  <Hangup/>
</Response>`;
      }
      break;

    case 'hangup':
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;
  }

  // Default: ring and fallback to voicemail
  return adapter.generateRingingResponse({
    timeout: rule.noAnswerRings ? rule.noAnswerRings * 5 : 15,
    webhookUrl: `${baseUrl}/api/webhooks/twilio/voice/status`,
  });
}
