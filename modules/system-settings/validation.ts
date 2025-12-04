import { z } from 'zod';

// === Enums ===

export const currencyPositionSchema = z.enum(['before', 'after'])
  .describe('Позиция символа валюты: before - перед суммой ($100), after - после суммы (100₽)');

export const aiProviderSchema = z.enum(['openai', 'anthropic', 'google'])
  .describe('AI провайдер: openai, anthropic, или google');

// === Input schemas (request body) ===

export const updateSystemSettingsSchema = z.object({
  currency: z.string()
    .min(3, 'Currency code must be 3 characters')
    .max(3, 'Currency code must be 3 characters')
    .toUpperCase()
    .optional()
    .describe('Код валюты ISO 4217 (например, USD, EUR, RUB)'),
  currencySymbol: z.string()
    .min(1, 'Currency symbol is required')
    .max(5, 'Currency symbol too long')
    .optional()
    .describe('Символ валюты (например, $, €, ₽)'),
  currencyPosition: currencyPositionSchema.optional()
    .describe('Позиция символа валюты'),
}).describe('Данные для обновления системных настроек');

// === Response schemas ===

export const systemSettingsResponseSchema = z.object({
  currency: z.string().describe('Код валюты ISO 4217'),
  currencySymbol: z.string().describe('Символ валюты'),
  currencyPosition: currencyPositionSchema.describe('Позиция символа валюты'),
  updatedAt: z.coerce.date().describe('Дата последнего обновления'),
  updatedBy: z.string().optional().describe('ID пользователя, который обновил настройки'),
}).describe('Системные настройки');

// === AI Settings Schemas ===

export const updateAIProviderSchema = z.object({
  provider: aiProviderSchema.describe('AI провайдер'),
  enabled: z.boolean().describe('Включен ли провайдер'),
  apiKey: z.string()
    .min(1, 'API key is required')
    .optional()
    .describe('API ключ провайдера (необязательно если уже сохранен)'),
  model: z.string()
    .min(1, 'Model is required')
    .describe('Название модели (например, gpt-4o-mini)'),
}).describe('Данные для настройки AI провайдера');

export const setActiveAIProviderSchema = z.object({
  provider: aiProviderSchema.describe('AI провайдер для установки как активный'),
}).describe('Данные для установки активного AI провайдера');

// === Input Types ===

export type UpdateSystemSettingsInput = z.infer<typeof updateSystemSettingsSchema>;
export type UpdateAIProviderInput = z.infer<typeof updateAIProviderSchema>;
export type SetActiveAIProviderInput = z.infer<typeof setActiveAIProviderSchema>;
