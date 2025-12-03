// VAPI AI Agent Adapter
// Документация: https://docs.vapi.ai

import {
  IAIAgentAdapter,
  HealthCheckResult,
  AgentContext,
  AIAgentCallEndedEvent,
} from './types';
import { VAPIConfig } from '../types';

export class VAPIAdapter implements IAIAgentAdapter {
  readonly type = 'vapi';
  readonly name = 'VAPI';

  private config: VAPIConfig | null = null;
  private baseUrl = 'https://api.vapi.ai';

  async initialize(config: Record<string, unknown>): Promise<void> {
    this.config = config as unknown as VAPIConfig;
  }

  private getHeaders(): Record<string, string> {
    if (!this.config) throw new Error('Adapter not initialized');
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
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
      const response = await this.request('GET', '/assistant');
      const latency = Date.now() - start;

      if (response.ok || response.status === 401) {
        // 401 means API is working but token invalid - still "healthy" from connectivity standpoint
        return { healthy: response.ok, latency };
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
    const assistantId = params.assistantId || this.config?.assistantId;

    if (!assistantId) {
      throw new Error('Assistant ID is required');
    }

    // VAPI SIP URI format
    return `sip:${assistantId}@sip.vapi.ai`;
  }

  async createOrUpdateAssistant(params: {
    name: string;
    systemPrompt: string;
    voice?: string;
    language?: string;
    transferNumber?: string;
    webhookUrl?: string;
  }): Promise<{ assistantId: string }> {
    const body: Record<string, unknown> = {
      name: params.name,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        systemPrompt: params.systemPrompt,
        temperature: 0.7,
      },
      voice: {
        provider: 'elevenlabs',
        voiceId: params.voice || this.config?.defaultVoice || 'rachel',
      },
      firstMessage: 'Здравствуйте! Чем я могу вам помочь?',
      firstMessageMode: 'assistant-speaks-first',
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 600, // 10 minutes max
      backgroundSound: 'office',
      backchannelingEnabled: true,
      backgroundDenoisingEnabled: true,
    };

    if (params.transferNumber) {
      body.forwardingPhoneNumber = params.transferNumber;
    }

    if (params.webhookUrl) {
      body.serverUrl = params.webhookUrl;
      body.serverUrlSecret = this.generateWebhookSecret();
    }

    const response = await this.request('POST', '/assistant', body);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create assistant');
    }

    return { assistantId: data.id };
  }

  /**
   * Создаёт ассистента с контекстом для конкретного звонка
   */
  async createAssistantForCall(params: {
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
      sipUri: `sip:${assistantId}@sip.vapi.ai`,
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
   - Перезвонить в рабочее время (если нерабочее время)
   - Соединить с дежурным менеджером (используй функцию transfer, если это срочно)
4. Если звонящий новый — попросить контактные данные
5. Быть вежливым и профессиональным

При завершении звонка создай краткую сводку разговора для CRM.

Важно:
- Говори на русском языке
- Не обещай того, что не можешь выполнить
- Если вопрос сложный — предложи связаться с менеджером
`.trim();
  }

  async parseWebhook(request: Request): Promise<AIAgentCallEndedEvent | null> {
    const data = await request.json();

    // VAPI call ended webhook
    if (data.message?.type === 'end-of-call-report') {
      const report = data.message;

      return {
        callId: report.call?.id || data.call?.id,
        assistantId: report.assistant?.id,
        duration: report.durationSeconds || 0,
        endReason: this.mapEndReason(report.endedReason),
        summary: report.summary,
        transcript: report.transcript?.map((t: { role: string; message: string }) => ({
          role: t.role === 'user' ? 'user' : 'assistant',
          content: t.message,
        })),
        recordingUrl: report.recordingUrl,
        metadata: {
          cost: report.cost,
          model: report.model,
          ...data,
        },
      };
    }

    return null;
  }

  async validateWebhook(request: Request): Promise<boolean> {
    // VAPI uses serverUrlSecret for validation
    // In production, implement proper signature validation
    const authHeader = request.headers.get('authorization');
    return !!authHeader;
  }

  private mapEndReason(
    reason: string
  ): 'customer_ended' | 'assistant_ended' | 'transferred' | 'error' {
    const reasonMap: Record<string, 'customer_ended' | 'assistant_ended' | 'transferred' | 'error'> = {
      'customer-ended-call': 'customer_ended',
      'assistant-ended-call': 'assistant_ended',
      'call-forwarded': 'transferred',
      'assistant-error': 'error',
      'max-duration-reached': 'assistant_ended',
      'silence-timed-out': 'assistant_ended',
    };
    return reasonMap[reason] || 'error';
  }

  private generateWebhookSecret(): string {
    return crypto.randomUUID().replace(/-/g, '');
  }
}

export default VAPIAdapter;
