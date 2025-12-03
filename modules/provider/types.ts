// Типы провайдеров телефонии и AI агентов

// === Типы провайдеров телефонии ===

export const TELEPHONY_PROVIDER_TYPES = ['twilio', 'telnyx', 'plivo'] as const;
export type TelephonyProviderType = typeof TELEPHONY_PROVIDER_TYPES[number];

// === Типы AI агентов ===

export const AI_AGENT_TYPES = ['vapi', 'elevenlabs', 'retell', 'bland'] as const;
export type AIAgentType = typeof AI_AGENT_TYPES[number];

// === Все типы провайдеров ===

export const PROVIDER_TYPES = [...TELEPHONY_PROVIDER_TYPES, ...AI_AGENT_TYPES] as const;
export type ProviderType = typeof PROVIDER_TYPES[number];

// === Категории провайдеров ===

export const PROVIDER_CATEGORIES = ['telephony', 'ai_agent'] as const;
export type ProviderCategory = typeof PROVIDER_CATEGORIES[number];

// === Возможности провайдеров ===

export const PROVIDER_CAPABILITIES = [
  'voice_inbound',
  'voice_outbound',
  'sms_inbound',
  'sms_outbound',
  'mms',
  'call_recording',
  'call_transfer',
  'warm_transfer',
  'ivr',
  'voicemail',
  'transcription',
  'ai_conversation',
  'sip_trunking',
] as const;
export type ProviderCapability = typeof PROVIDER_CAPABILITIES[number];

// === Конфигурации провайдеров ===

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  apiKeySid?: string;
  apiKeySecret?: string;
}

export interface TelnyxConfig {
  apiKey: string;
  publicKey?: string;
  connectionId?: string;
}

export interface PlivoConfig {
  authId: string;
  authToken: string;
}

export interface VAPIConfig {
  apiKey: string;
  assistantId?: string;
  defaultVoice?: string;
}

export interface ElevenLabsConfig {
  apiKey: string;
  agentId?: string;
  voiceId?: string;
}

export interface RetellConfig {
  apiKey: string;
  agentId?: string;
}

export interface BlandConfig {
  apiKey: string;
  agentId?: string;
}

export type ProviderConfig =
  | TwilioConfig
  | TelnyxConfig
  | PlivoConfig
  | VAPIConfig
  | ElevenLabsConfig
  | RetellConfig
  | BlandConfig;

// === Основные интерфейсы ===

export interface ChannelProvider {
  id: string;
  channelId: string;
  type: ProviderType;
  category: ProviderCategory;
  name: string;
  description?: string;
  config: ProviderConfig;
  webhookUrl?: string;
  webhookSecret?: string;
  capabilities: ProviderCapability[];
  isDefault: boolean;
  priority: number;
  isActive: boolean;
  lastHealthCheck?: Date;
  healthStatus?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  createdAt: Date;
  updatedAt: Date;
}

// === DTOs ===

export interface CreateChannelProviderDTO {
  channelId: string;
  type: ProviderType;
  name: string;
  description?: string;
  config: ProviderConfig;
  capabilities?: ProviderCapability[];
  isDefault?: boolean;
  priority?: number;
  isActive?: boolean;
}

export interface UpdateChannelProviderDTO {
  name?: string;
  description?: string;
  config?: Partial<ProviderConfig>;
  capabilities?: ProviderCapability[];
  isDefault?: boolean;
  priority?: number;
  isActive?: boolean;
}

// === Response types ===

export interface ChannelProviderResponse {
  id: string;
  channelId: string;
  type: ProviderType;
  category: ProviderCategory;
  name: string;
  description?: string;
  webhookUrl?: string;
  capabilities: ProviderCapability[];
  isDefault: boolean;
  priority: number;
  isActive: boolean;
  lastHealthCheck?: Date;
  healthStatus?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  createdAt: Date;
  updatedAt: Date;
  // Note: config is NOT included in response for security
}

export interface ChannelProviderListResponse {
  providers: ChannelProviderResponse[];
  total: number;
}

// === Provider Metadata ===

export interface ProviderMetadata {
  type: ProviderType;
  category: ProviderCategory;
  name: string;
  description: string;
  logo?: string;
  capabilities: ProviderCapability[];
  configFields: ConfigField[];
  documentationUrl?: string;
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'boolean';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
}

// === Метаданные всех провайдеров ===

export const PROVIDER_METADATA: Record<ProviderType, ProviderMetadata> = {
  twilio: {
    type: 'twilio',
    category: 'telephony',
    name: 'Twilio',
    description: 'Облачная платформа для голосовой связи и SMS',
    capabilities: [
      'voice_inbound', 'voice_outbound', 'sms_inbound', 'sms_outbound',
      'mms', 'call_recording', 'call_transfer', 'warm_transfer', 'ivr',
      'voicemail', 'transcription', 'sip_trunking'
    ],
    configFields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true, placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { key: 'apiKeySid', label: 'API Key SID', type: 'text', required: false, helpText: 'Опционально, для повышенной безопасности' },
      { key: 'apiKeySecret', label: 'API Key Secret', type: 'password', required: false },
    ],
    documentationUrl: 'https://www.twilio.com/docs',
  },
  telnyx: {
    type: 'telnyx',
    category: 'telephony',
    name: 'Telnyx',
    description: 'Телефония с низкой латентностью и конкурентными ценами',
    capabilities: [
      'voice_inbound', 'voice_outbound', 'sms_inbound', 'sms_outbound',
      'mms', 'call_recording', 'call_transfer', 'ivr', 'voicemail',
      'transcription', 'sip_trunking'
    ],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'publicKey', label: 'Public Key', type: 'text', required: false, helpText: 'Для верификации webhook' },
      { key: 'connectionId', label: 'Connection ID', type: 'text', required: false },
    ],
    documentationUrl: 'https://developers.telnyx.com/docs',
  },
  plivo: {
    type: 'plivo',
    category: 'telephony',
    name: 'Plivo',
    description: 'Бюджетная платформа для голоса и SMS',
    capabilities: [
      'voice_inbound', 'voice_outbound', 'sms_inbound', 'sms_outbound',
      'call_recording', 'call_transfer', 'ivr'
    ],
    configFields: [
      { key: 'authId', label: 'Auth ID', type: 'text', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
    ],
    documentationUrl: 'https://www.plivo.com/docs/',
  },
  vapi: {
    type: 'vapi',
    category: 'ai_agent',
    name: 'VAPI',
    description: 'AI голосовые агенты с поддержкой warm transfer',
    capabilities: ['ai_conversation', 'call_transfer', 'warm_transfer', 'transcription'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'assistantId', label: 'Assistant ID', type: 'text', required: false, helpText: 'ID ассистента по умолчанию' },
      { key: 'defaultVoice', label: 'Голос по умолчанию', type: 'select', required: false, options: [
        { value: 'rachel', label: 'Rachel (ElevenLabs)' },
        { value: 'josh', label: 'Josh (ElevenLabs)' },
        { value: 'alloy', label: 'Alloy (OpenAI)' },
        { value: 'nova', label: 'Nova (OpenAI)' },
      ]},
    ],
    documentationUrl: 'https://docs.vapi.ai',
  },
  elevenlabs: {
    type: 'elevenlabs',
    category: 'ai_agent',
    name: 'ElevenLabs',
    description: 'AI агенты с лучшим качеством голоса',
    capabilities: ['ai_conversation', 'call_transfer', 'transcription', 'sip_trunking'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'agentId', label: 'Agent ID', type: 'text', required: false },
      { key: 'voiceId', label: 'Voice ID', type: 'text', required: false, helpText: 'ID голоса из библиотеки ElevenLabs' },
    ],
    documentationUrl: 'https://elevenlabs.io/docs',
  },
  retell: {
    type: 'retell',
    category: 'ai_agent',
    name: 'Retell AI',
    description: 'Масштабируемые AI голосовые агенты',
    capabilities: ['ai_conversation', 'call_transfer', 'warm_transfer', 'transcription', 'sip_trunking'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'agentId', label: 'Agent ID', type: 'text', required: false },
    ],
    documentationUrl: 'https://docs.retellai.com',
  },
  bland: {
    type: 'bland',
    category: 'ai_agent',
    name: 'Bland AI',
    description: 'AI агенты с SMS интеграцией',
    capabilities: ['ai_conversation', 'call_transfer', 'sms_outbound', 'transcription'],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'agentId', label: 'Agent ID', type: 'text', required: false },
    ],
    documentationUrl: 'https://docs.bland.ai',
  },
};
