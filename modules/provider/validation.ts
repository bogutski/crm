import { z } from 'zod';
import {
  PROVIDER_TYPES,
  PROVIDER_CATEGORIES,
  PROVIDER_CAPABILITIES,
} from './types';

// === Config schemas для каждого провайдера ===

const twilioConfigSchema = z.object({
  accountSid: z.string()
    .min(1, 'Account SID обязателен')
    .regex(/^AC[a-f0-9]{32}$/, 'Неверный формат Account SID'),
  authToken: z.string().min(1, 'Auth Token обязателен'),
  apiKeySid: z.string().optional(),
  apiKeySecret: z.string().optional(),
}).describe('Конфигурация Twilio');

const telnyxConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key обязателен'),
  publicKey: z.string().optional(),
  connectionId: z.string().optional(),
}).describe('Конфигурация Telnyx');

const plivoConfigSchema = z.object({
  authId: z.string().min(1, 'Auth ID обязателен'),
  authToken: z.string().min(1, 'Auth Token обязателен'),
}).describe('Конфигурация Plivo');

const vapiConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key обязателен'),
  assistantId: z.string().optional(),
  defaultVoice: z.string().optional(),
}).describe('Конфигурация VAPI');

const elevenlabsConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key обязателен'),
  agentId: z.string().optional(),
  voiceId: z.string().optional(),
}).describe('Конфигурация ElevenLabs');

const retellConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key обязателен'),
  agentId: z.string().optional(),
}).describe('Конфигурация Retell AI');

const blandConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key обязателен'),
  agentId: z.string().optional(),
}).describe('Конфигурация Bland AI');

// Объединённая схема конфигурации (выбирается на основе type)
const providerConfigSchema = z.union([
  twilioConfigSchema,
  telnyxConfigSchema,
  plivoConfigSchema,
  vapiConfigSchema,
  elevenlabsConfigSchema,
  retellConfigSchema,
  blandConfigSchema,
]);

// === Input schemas ===

export const createChannelProviderSchema = z.object({
  channelId: z.string()
    .min(1, 'ID канала обязателен')
    .describe('ID канала коммуникации'),
  type: z.enum(PROVIDER_TYPES, {
    errorMap: () => ({ message: 'Неверный тип провайдера' }),
  }).describe('Тип провайдера'),
  name: z.string()
    .min(1, 'Название обязательно')
    .max(100, 'Название не должно превышать 100 символов')
    .describe('Название провайдера'),
  description: z.string()
    .max(500, 'Описание не должно превышать 500 символов')
    .optional()
    .describe('Описание провайдера'),
  config: providerConfigSchema
    .describe('Конфигурация провайдера'),
  capabilities: z.array(z.enum(PROVIDER_CAPABILITIES))
    .optional()
    .describe('Возможности провайдера'),
  isDefault: z.boolean()
    .optional()
    .default(false)
    .describe('Использовать как провайдер по умолчанию'),
  priority: z.number()
    .min(0)
    .max(100)
    .optional()
    .default(0)
    .describe('Приоритет (для failover)'),
  isActive: z.boolean()
    .optional()
    .default(true)
    .describe('Активен ли провайдер'),
}).describe('Данные для создания провайдера');

export const updateChannelProviderSchema = z.object({
  name: z.string()
    .min(1)
    .max(100)
    .optional()
    .describe('Название провайдера'),
  description: z.string()
    .max(500)
    .optional()
    .describe('Описание провайдера'),
  config: providerConfigSchema
    .optional()
    .describe('Конфигурация провайдера'),
  capabilities: z.array(z.enum(PROVIDER_CAPABILITIES))
    .optional()
    .describe('Возможности провайдера'),
  isDefault: z.boolean()
    .optional()
    .describe('Использовать как провайдер по умолчанию'),
  priority: z.number()
    .min(0)
    .max(100)
    .optional()
    .describe('Приоритет'),
  isActive: z.boolean()
    .optional()
    .describe('Активен ли провайдер'),
}).describe('Данные для обновления провайдера');

export const searchChannelProvidersSchema = z.object({
  channelId: z.string().optional().describe('Фильтр по каналу'),
  category: z.enum(PROVIDER_CATEGORIES).optional().describe('Фильтр по категории'),
  type: z.enum(PROVIDER_TYPES).optional().describe('Фильтр по типу'),
  isActive: z.boolean().optional().describe('Фильтр по активности'),
  includeInactive: z.boolean().optional().default(false).describe('Включить неактивные'),
}).describe('Параметры поиска провайдеров');

// === Response schemas ===

export const channelProviderResponseSchema = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  channelId: z.string().describe('ID канала'),
  type: z.enum(PROVIDER_TYPES).describe('Тип провайдера'),
  category: z.enum(PROVIDER_CATEGORIES).describe('Категория'),
  name: z.string().describe('Название'),
  description: z.string().optional().describe('Описание'),
  webhookUrl: z.string().optional().describe('URL для webhook'),
  capabilities: z.array(z.enum(PROVIDER_CAPABILITIES)).describe('Возможности'),
  isDefault: z.boolean().describe('Провайдер по умолчанию'),
  priority: z.number().describe('Приоритет'),
  isActive: z.boolean().describe('Активен'),
  lastHealthCheck: z.coerce.date().optional().describe('Последняя проверка'),
  healthStatus: z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']).optional().describe('Статус'),
  createdAt: z.coerce.date().describe('Дата создания'),
  updatedAt: z.coerce.date().describe('Дата обновления'),
}).describe('Провайдер канала');

export const channelProviderListResponseSchema = z.object({
  providers: z.array(channelProviderResponseSchema).describe('Список провайдеров'),
  total: z.number().describe('Общее количество'),
}).describe('Список провайдеров');

// === Валидация конфигурации по типу провайдера ===

export function validateConfigForType(type: string, config: unknown): { success: boolean; error?: string } {
  try {
    switch (type) {
      case 'twilio':
        twilioConfigSchema.parse(config);
        break;
      case 'telnyx':
        telnyxConfigSchema.parse(config);
        break;
      case 'plivo':
        plivoConfigSchema.parse(config);
        break;
      case 'vapi':
        vapiConfigSchema.parse(config);
        break;
      case 'elevenlabs':
        elevenlabsConfigSchema.parse(config);
        break;
      case 'retell':
        retellConfigSchema.parse(config);
        break;
      case 'bland':
        blandConfigSchema.parse(config);
        break;
      default:
        return { success: false, error: `Неизвестный тип провайдера: ${type}` };
    }
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Ошибка валидации' };
    }
    return { success: false, error: 'Неизвестная ошибка валидации' };
  }
}

// === Input Types ===

export type CreateChannelProviderInput = z.infer<typeof createChannelProviderSchema>;
export type UpdateChannelProviderInput = z.infer<typeof updateChannelProviderSchema>;
export type SearchChannelProvidersInput = z.infer<typeof searchChannelProvidersSchema>;
