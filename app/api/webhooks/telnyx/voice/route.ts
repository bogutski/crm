import { NextRequest, NextResponse } from 'next/server';
import { getUserPhoneLineByNumber } from '@/modules/phone-line';
import { findMatchingRule, incrementTriggeredCount } from '@/modules/routing-rule';
import { getProviderConfig, getProvidersForRouting } from '@/modules/provider';
import {
  createAIAgentAdapter,
  TelnyxAdapter,
} from '@/modules/provider/adapters';

export async function POST(request: NextRequest) {
  try {
    // Parse Telnyx webhook
    const adapter = new TelnyxAdapter();
    await adapter.initialize({});

    const event = await adapter.parseWebhook(request.clone());

    if (!event || !('callId' in event)) {
      return NextResponse.json({ status: 'ignored' });
    }

    const callEvent = event;
    console.log('Incoming call from Telnyx:', callEvent);

    // Find phone line by the "to" number
    const phoneLine = await getUserPhoneLineByNumber(callEvent.to);

    if (!phoneLine) {
      console.log('Phone line not found for:', callEvent.to);
      return NextResponse.json({
        commands: [
          { type: 'speak', payload: 'Номер не найден в системе. До свидания.' },
          { type: 'hangup' },
        ],
      });
    }

    // Find matching routing rule
    const rule = await findMatchingRule(phoneLine.id, {
      isNoAnswer: callEvent.status === 'no-answer',
      isBusy: callEvent.status === 'busy',
      isOffline: false,
      isVIP: false,
      isNewCaller: true,
    });

    if (!rule) {
      // No rule matched - ring the owner with default timeout
      return NextResponse.json({
        commands: [
          { type: 'answer' },
          {
            type: 'bridge',
            payload: {
              to: phoneLine.forwardTo || phoneLine.phoneNumber,
              timeout_secs: 30,
            },
          },
        ],
      });
    }

    // Increment rule trigger count
    await incrementTriggeredCount(rule.id);

    // Execute action based on rule
    const commands = await executeRuleActionTelnyx(rule, phoneLine, callEvent);

    return NextResponse.json({ commands });
  } catch (error) {
    console.error('Error handling Telnyx voice webhook:', error);

    return NextResponse.json({
      commands: [
        { type: 'speak', payload: 'Произошла ошибка. Попробуйте позвонить позже.' },
        { type: 'hangup' },
      ],
    });
  }
}

async function executeRuleActionTelnyx(
  rule: Awaited<ReturnType<typeof findMatchingRule>>,
  phoneLine: Awaited<ReturnType<typeof getUserPhoneLineByNumber>>,
  callEvent: { callId: string; from: string; to: string }
): Promise<Array<Record<string, unknown>>> {
  if (!rule || !phoneLine) {
    return [
      { type: 'speak', payload: 'Ошибка маршрутизации.' },
      { type: 'hangup' },
    ];
  }

  const action = rule.action;
  const commands: Array<Record<string, unknown>> = [{ type: 'answer' }];

  switch (action.type) {
    case 'forward_number':
      if (action.targetNumber) {
        commands.push({
          type: 'transfer',
          payload: { to: action.targetNumber },
        });
      }
      break;

    case 'forward_ai_agent':
      if (action.aiProviderId) {
        try {
          const config = await getProviderConfig(action.aiProviderId);
          if (!config) throw new Error('AI provider config not found');

          const providers = await getProvidersForRouting(
            phoneLine.providerId,
            'ai_agent'
          );
          const aiProvider = providers.find(p => p.id === action.aiProviderId);

          if (!aiProvider) throw new Error('AI provider not found');

          const aiAdapter = await createAIAgentAdapter(
            aiProvider.type as 'vapi' | 'elevenlabs',
            config as Record<string, unknown>
          );

          const sipUri = await aiAdapter.getSipUri({
            assistantId: action.aiAssistantId,
            context: {
              reason: rule.condition === 'after_hours' ? 'after_hours' :
                     rule.condition === 'no_answer' ? 'no_answer' :
                     rule.condition === 'busy' ? 'busy' : undefined,
            },
          });

          commands.push({
            type: 'transfer',
            payload: { to: sipUri },
          });
        } catch (error) {
          console.error('Error forwarding to AI agent:', error);
          commands.push(
            { type: 'speak', payload: 'Ассистент недоступен. Оставьте сообщение после сигнала.' },
            { type: 'record_start', payload: { format: 'mp3' } }
          );
        }
      }
      break;

    case 'voicemail':
      commands.push(
        { type: 'speak', payload: action.voicemailGreeting || 'Оставьте сообщение после сигнала.' },
        { type: 'record_start', payload: { format: 'mp3', max_length: 120 } }
      );
      break;

    case 'play_message':
      if (action.messageUrl) {
        commands.push({ type: 'playback_start', payload: { audio_url: action.messageUrl } });
      } else if (action.messageText) {
        commands.push({ type: 'speak', payload: action.messageText });
      }
      commands.push({ type: 'hangup' });
      break;

    case 'hangup':
      commands.push({ type: 'hangup' });
      break;

    default:
      // Default: bridge to owner with timeout
      commands.push({
        type: 'bridge',
        payload: {
          to: phoneLine.forwardTo || callEvent.to,
          timeout_secs: rule.noAnswerRings ? rule.noAnswerRings * 5 : 15,
        },
      });
  }

  return commands;
}
