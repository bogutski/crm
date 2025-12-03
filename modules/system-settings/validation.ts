import { z } from 'zod';

// === Enums ===

export const currencyPositionSchema = z.enum(['before', 'after'])
  .describe('Позиция символа валюты: before - перед суммой ($100), after - после суммы (100₽)');

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

// === Input Types ===

export type UpdateSystemSettingsInput = z.infer<typeof updateSystemSettingsSchema>;
