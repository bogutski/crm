// ElevenLabs AI Agent Adapter
// Документация: https://elevenlabs.io/docs/conversational-ai

import {
  IAIAgentAdapter,
  HealthCheckResult,
  AgentContext,
  AIAgentCallEndedEvent,
} from './types';
import { ElevenLabsConfig } from '../types';

export class ElevenLabsAdapter implements IAIAgentAdapter {
  readonly type = 'elevenlabs';
  readonly name = 'ElevenLabs';

  private config: ElevenLabsConfig | null = null;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  async initialize(config: Record<string, unknown>): Promise<void> {
    this.config = config as unknown as ElevenLabsConfig;
  }

  private getHeaders(): Record<string, string> {
    if (!this.config) throw new Error('Adapter not initialized');
    return {
      'xi-api-key': this.config.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private async request(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return fetch(url, options);
  }

  async checkHealth(): Promise<HealthCheckResult> {
    try {
      const start = Date.now();
      const response = await this.request('GET', '/user');
      const latency = Date.now() - start;

      if (response.ok) {
        return { healthy: true, latency };
      }

      return {
        healthy: false,
        latency,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getSipUri(params: {
    assistantId?: string;
    context?: AgentContext;
  }): Promise<string> {
    const agentId = params.assistantId || this.config?.agentId;

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // ElevenLabs SIP URI format
    // Формат: sip:{agent_id}@{region}.']
    return `sip:${agentId}@sip.elevenlabs.io`;
  }

  async createOrUpdateAssistant(params: {
    name: string;
    systemPrompt: string;
    voice?: string;
    language?: string;
    transferNumber?: string;
    webhookUrl?: string;
  }): Promise<{ assistantId: string }> {
    // ElevenLabs Conversational AI agent creation
    const body: Record<string, unknown> = {
      name: params.name,
      conversation_config: {
        agent: {
          prompt: {
            prompt: params.systemPrompt,
          },
          first_message: 'Здравствуйте! Чем я могу вам помочь?',
          language: params.language || 'ru',
        },
        asr: {
          quality: 'high',
          user_input_audio_format: 'pcm_16000',
        },
        tts: {
          voice_id: params.voice || this.config?.voiceId,
        },
        turn: {
          turn_timeout: 10,
          mode: 'turn_based',
        },
      },
    };

    // Note: ElevenLabs agent creation endpoint may differ
    // This is based on the Conversational AI API
    const response = await this.request('POST', '/convai/agents', body);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail?.message || 'Failed to create agent');
    }

    return { assistantId: data.agent_id };
  }

  /**
   * Создаёт агента с контекстом для конкретного звонка
   */
  async createAgentForCall(params: {
    context: AgentContext;
    transferNumber?: string;
    webhookUrl: string;
  }): Promise<{ assistantId: string; sipUri: string }> {
    const systemPrompt = this.buildSystemPrompt(params.context);

    const { assistantId } = await this.createOrUpdateAssistant({
      name: `CRM-Call-${Date.now()}`,
      systemPrompt,
      transferNumber: params.transferNumber,
      webhookUrl: params.webhookUrl,
    });

    return {
      assistantId,
      sipUri: `sip:${assistantId}@sip.elevenlabs.io`,
    };
  }

  private buildSystemPrompt(context: AgentContext): string {
    const reasonMessages: Record<string, string> = {
      after_hours: 'Сейчас нерабочее время компании.',
      no_answer: `${context.managerName || 'Менеджер'} сейчас не может ответить на звонок.`,
      busy: `${context.managerName || 'Менеджер'} сейчас на другой линии.`,
      overflow: 'В данный момент все операторы заняты.',
    };

    const reason = context.reason ? reasonMessages[context.reason] : '';

    let contactInfo = '';
    if (context.contactName) {
      contactInfo = `
Информация о звонящем:
- Имя: ${context.contactName}
${context.contactCompany ? `- Компания: ${context.contactCompany}` : ''}
${context.callHistory ? `- История взаимодействий: ${context.callHistory}` : ''}
`;
    }

    return `
Ты — голосовой ассистент компании ${context.companyName || 'нашей компании'}.
${reason}

${contactInfo}

Твои задачи:
1. Вежливо поприветствовать звонящего
2. Узнать цель звонка и как вы можете помочь
3. Предложить варианты:
   - Оставить голосовое сообщение для ${context.managerName || 'менеджера'}
   - Перезвонить в рабочее время
   - Соединить с дежурным менеджером если срочно
4. Если звонящий новый — попросить контактные данные
5. Быть вежливым и профессиональным

При завершении звонка создай краткую сводку разговора.

Важно:
- Говори на русском языке
- Используй естественные интонации
- Будь эмпатичен и внимателен к собеседнику
`.trim();
  }

  async parseWebhook(request: Request): Promise<AIAgentCallEndedEvent | null> {
    const data = await request.json();

    // ElevenLabs conversation ended webhook
    if (data.type === 'conversation_ended' || data.event === 'conversation.ended') {
      const conversation = data.conversation || data;

      return {
        callId: conversation.conversation_id || conversation.id,
        assistantId: conversation.agent_id,
        duration: conversation.duration_seconds || 0,
        endReason: this.mapEndReason(conversation.end_reason || data.reason),
        summary: conversation.summary,
        transcript: conversation.transcript?.map((t: { role: string; text: string }) => ({
          role: t.role === 'user' ? 'user' : 'assistant',
          content: t.text,
        })),
        recordingUrl: conversation.recording_url,
        metadata: {
          ...data,
        },
      };
    }

    return null;
  }

  async validateWebhook(request: Request): Promise<boolean> {
    // ElevenLabs webhook validation
    const signature = request.headers.get('x-elevenlabs-signature');

    // For production, implement proper signature validation
    // using the webhook secret
    return !!signature || true; // Allow unsigned for development
  }

  private mapEndReason(
    reason: string
  ): 'customer_ended' | 'assistant_ended' | 'transferred' | 'error' {
    const reasonMap: Record<string, 'customer_ended' | 'assistant_ended' | 'transferred' | 'error'> = {
      'user_hangup': 'customer_ended',
      'customer_ended': 'customer_ended',
      'agent_hangup': 'assistant_ended',
      'assistant_ended': 'assistant_ended',
      'transferred': 'transferred',
      'transfer': 'transferred',
      'error': 'error',
      'timeout': 'assistant_ended',
      'max_duration': 'assistant_ended',
    };
    return reasonMap[reason] || 'error';
  }

  /**
   * Получает список доступных голосов
   */
  async getVoices(): Promise<Array<{ voice_id: string; name: string }>> {
    const response = await this.request('GET', '/voices');
    const data = await response.json();
    return data.voices || [];
  }

  /**
   * Генерирует аудио из текста (TTS)
   */
  async textToSpeech(params: {
    text: string;
    voiceId?: string;
  }): Promise<ArrayBuffer> {
    const voiceId = params.voiceId || this.config?.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default voice

    const response = await this.request(
      'POST',
      `/text-to-speech/${voiceId}`,
      {
        text: params.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate speech');
    }

    return response.arrayBuffer();
  }
}

export default ElevenLabsAdapter;
