import {
  ITelephonyProvider,
  ITelephonyCredentials,
  ITelephonyProviderSettings,
  TelephonyProviderCode,
} from './models/provider';

// Re-export types from model
export type {
  ITelephonyProvider,
  ITelephonyCredentials,
  ITelephonyProviderSettings,
  TelephonyProviderCode,
};

// DTO для создания провайдера
export interface CreateTelephonyProviderDTO {
  code: TelephonyProviderCode;
  name: string;
  enabled?: boolean;
  credentials?: Partial<ITelephonyCredentials>;
  settings?: Partial<ITelephonyProviderSettings>;
}

// DTO для обновления провайдера
export interface UpdateTelephonyProviderDTO {
  name?: string;
  enabled?: boolean;
  credentials?: Partial<ITelephonyCredentials>;
  webhookSecret?: string;
  settings?: Partial<ITelephonyProviderSettings>;
}

// Ответ API провайдера (без секретов)
export interface TelephonyProviderResponse {
  _id: string;
  code: TelephonyProviderCode;
  name: string;
  enabled: boolean;
  isActive: boolean;
  webhookUrl?: string;
  hasCredentials: {
    apiKey: boolean;
    accountSid: boolean;
    authToken: boolean;
    apiSecret: boolean;
  };
  hasWebhookSecret: boolean;
  settings: ITelephonyProviderSettings;
  createdAt: Date;
  updatedAt: Date;
}

// Информация о провайдере для UI
export interface TelephonyProviderInfo {
  code: TelephonyProviderCode;
  name: string;
  description: string;
  website: string;
  logo?: string;
  requiredCredentials: Array<{
    field: keyof ITelephonyCredentials;
    label: string;
    placeholder: string;
    helpText?: string;
  }>;
}

// Статические данные о провайдерах
export const TELEPHONY_PROVIDERS: Record<TelephonyProviderCode, TelephonyProviderInfo> = {
  telnyx: {
    code: 'telnyx',
    name: 'Telnyx',
    description: 'Программируемая телефония с низкими ценами и собственной сетью',
    website: 'https://telnyx.com',
    requiredCredentials: [
      {
        field: 'apiKey',
        label: 'API Key',
        placeholder: 'KEY...',
        helpText: 'Найдите в Mission Control Portal → API Keys',
      },
    ],
  },
  twilio: {
    code: 'twilio',
    name: 'Twilio',
    description: 'Самый популярный провайдер программируемых коммуникаций',
    website: 'https://twilio.com',
    requiredCredentials: [
      {
        field: 'accountSid',
        label: 'Account SID',
        placeholder: 'AC...',
        helpText: 'Найдите в Twilio Console → Account Info',
      },
      {
        field: 'authToken',
        label: 'Auth Token',
        placeholder: '...',
        helpText: 'Найдите в Twilio Console → Account Info',
      },
    ],
  },
  vonage: {
    code: 'vonage',
    name: 'Vonage',
    description: 'API-first платформа для голосовой связи и сообщений',
    website: 'https://vonage.com',
    requiredCredentials: [
      {
        field: 'apiKey',
        label: 'API Key',
        placeholder: '...',
        helpText: 'Найдите в Vonage Dashboard → API Settings',
      },
      {
        field: 'apiSecret',
        label: 'API Secret',
        placeholder: '...',
        helpText: 'Найдите в Vonage Dashboard → API Settings',
      },
    ],
  },
};

// Результат валидации credentials
export interface CredentialsValidationResult {
  valid: boolean;
  error?: string;
  accountInfo?: {
    balance?: number;
    currency?: string;
    accountName?: string;
  };
}

// Результат тестового звонка
export interface TestCallResult {
  success: boolean;
  error?: string;
  callId?: string;
}

// Функция для санитизации провайдера (скрытие секретов)
export function sanitizeProvider(provider: ITelephonyProvider): TelephonyProviderResponse {
  return {
    _id: provider._id.toString(),
    code: provider.code,
    name: provider.name,
    enabled: provider.enabled,
    isActive: provider.isActive,
    webhookUrl: provider.webhookUrl,
    hasCredentials: {
      apiKey: !!provider.credentials?.apiKey,
      accountSid: !!provider.credentials?.accountSid,
      authToken: !!provider.credentials?.authToken,
      apiSecret: !!provider.credentials?.apiSecret,
    },
    hasWebhookSecret: !!provider.webhookSecret,
    settings: provider.settings || {},
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}
