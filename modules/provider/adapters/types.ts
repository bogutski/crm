// Типы для адаптеров провайдеров

// === Результаты операций ===

export interface SendMessageResult {
  success: boolean;
  externalId?: string;
  error?: string;
  providerResponse?: unknown;
}

export interface SendCallResult {
  success: boolean;
  callId?: string;
  error?: string;
  providerResponse?: unknown;
}

export interface TransferCallResult {
  success: boolean;
  newCallId?: string;
  error?: string;
  providerResponse?: unknown;
}

// === Входящие события ===

export interface InboundCallEvent {
  callId: string;
  from: string;
  to: string;
  direction: 'inbound';
  status: 'ringing' | 'answered' | 'completed' | 'failed' | 'busy' | 'no-answer';
  timestamp: Date;
  duration?: number;
  recordingUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface InboundMessageEvent {
  messageId: string;
  from: string;
  to: string;
  body: string;
  mediaUrls?: string[];
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// === Health Check ===

export interface HealthCheckResult {
  healthy: boolean;
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}

// === Интерфейс адаптера телефонии ===

export interface ITelephonyAdapter {
  readonly type: string;
  readonly name: string;

  // Инициализация
  initialize(config: Record<string, unknown>): Promise<void>;

  // Health check
  checkHealth(): Promise<HealthCheckResult>;

  // Исходящие звонки
  makeCall(params: {
    from: string;
    to: string;
    webhookUrl: string;
    timeout?: number;
    machineDetection?: boolean;
  }): Promise<SendCallResult>;

  // Управление звонком
  answerCall(callId: string): Promise<void>;
  hangupCall(callId: string): Promise<void>;
  holdCall(callId: string): Promise<void>;
  unholdCall(callId: string): Promise<void>;

  // Переадресация
  transferCall(params: {
    callId: string;
    to: string;
    type: 'blind' | 'warm';
    announcementUrl?: string;
  }): Promise<TransferCallResult>;

  // Переадресация на SIP (для AI агентов)
  transferToSip(params: {
    callId: string;
    sipUri: string;
  }): Promise<TransferCallResult>;

  // SMS
  sendSms(params: {
    from: string;
    to: string;
    body: string;
    mediaUrls?: string[];
  }): Promise<SendMessageResult>;

  // Запись
  startRecording(callId: string): Promise<{ recordingId: string }>;
  stopRecording(callId: string): Promise<{ recordingUrl?: string }>;

  // TTS
  playText(callId: string, text: string, voice?: string): Promise<void>;
  playAudio(callId: string, audioUrl: string): Promise<void>;

  // Webhook parsing
  parseWebhook(request: Request): Promise<InboundCallEvent | InboundMessageEvent | null>;
  validateWebhook(request: Request): Promise<boolean>;

  // Генерация TwiML/TeXML
  generateRingingResponse(params: {
    timeout?: number;
    webhookUrl: string;
  }): string;

  generateForwardResponse(params: {
    to: string;
    callerId?: string;
    timeout?: number;
  }): string;

  generateVoicemailResponse(params: {
    greeting?: string;
    maxLength?: number;
    transcribe?: boolean;
    webhookUrl: string;
  }): string;
}

// === Интерфейс адаптера AI агента ===

export interface IAIAgentAdapter {
  readonly type: string;
  readonly name: string;

  // Инициализация
  initialize(config: Record<string, unknown>): Promise<void>;

  // Health check
  checkHealth(): Promise<HealthCheckResult>;

  // Получение SIP URI для переадресации звонка
  getSipUri(params: {
    assistantId?: string;
    context?: AgentContext;
  }): Promise<string>;

  // Создание/обновление ассистента с контекстом
  createOrUpdateAssistant(params: {
    name: string;
    systemPrompt: string;
    voice?: string;
    language?: string;
    transferNumber?: string;
    webhookUrl?: string;
  }): Promise<{ assistantId: string }>;

  // Webhook parsing
  parseWebhook(request: Request): Promise<AIAgentCallEndedEvent | null>;
  validateWebhook(request: Request): Promise<boolean>;
}

export interface AgentContext {
  managerName?: string;
  managerPhone?: string;
  companyName?: string;
  contactName?: string;
  contactCompany?: string;
  callHistory?: string;
  reason?: 'after_hours' | 'no_answer' | 'busy' | 'overflow';
}

export interface AIAgentCallEndedEvent {
  callId: string;
  assistantId: string;
  duration: number;
  endReason: 'customer_ended' | 'assistant_ended' | 'transferred' | 'error';
  summary?: string;
  transcript?: Array<{ role: 'user' | 'assistant'; content: string }>;
  recordingUrl?: string;
  metadata?: Record<string, unknown>;
}
