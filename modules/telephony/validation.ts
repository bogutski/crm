import { z } from 'zod';

// === Enums ===

export const telephonyProviderCodeSchema = z.enum(['telnyx', 'twilio', 'vonage'])
  .describe('Код провайдера телефонии: telnyx, twilio, или vonage');

// === Credentials Schemas ===

export const telephonyCredentialsSchema = z.object({
  // Telnyx
  apiKey: z.string().min(1).optional()
    .describe('API ключ (для Telnyx и Vonage)'),

  // Twilio
  accountSid: z.string().min(1).optional()
    .describe('Account SID (для Twilio)'),
  authToken: z.string().min(1).optional()
    .describe('Auth Token (для Twilio)'),

  // Vonage
  apiSecret: z.string().min(1).optional()
    .describe('API Secret (для Vonage)'),
}).describe('Учётные данные провайдера');

// === Settings Schema ===

export const telephonyProviderSettingsSchema = z.object({
  defaultCallerId: z.string().optional()
    .describe('Номер по умолчанию для исходящих звонков'),
  recordCalls: z.boolean().optional()
    .describe('Записывать звонки'),
  transcribeCalls: z.boolean().optional()
    .describe('Транскрибировать звонки'),
  voicemailEnabled: z.boolean().optional()
    .describe('Включить голосовую почту'),
}).describe('Настройки провайдера');

// === Input Schemas ===

export const createTelephonyProviderSchema = z.object({
  code: telephonyProviderCodeSchema
    .describe('Код провайдера'),
  name: z.string().min(1).max(100)
    .describe('Название провайдера'),
  enabled: z.boolean().optional().default(false)
    .describe('Включен ли провайдер'),
  credentials: telephonyCredentialsSchema.optional()
    .describe('Учётные данные'),
  settings: telephonyProviderSettingsSchema.optional()
    .describe('Настройки'),
}).describe('Данные для создания провайдера телефонии');

export const updateTelephonyProviderSchema = z.object({
  name: z.string().min(1).max(100).optional()
    .describe('Название провайдера'),
  enabled: z.boolean().optional()
    .describe('Включен ли провайдер'),
  credentials: telephonyCredentialsSchema.optional()
    .describe('Учётные данные'),
  webhookSecret: z.string().optional()
    .describe('Секрет для валидации webhook'),
  settings: telephonyProviderSettingsSchema.optional()
    .describe('Настройки'),
}).describe('Данные для обновления провайдера телефонии');

// === Response Schemas ===

export const telephonyProviderResponseSchema = z.object({
  _id: z.string(),
  code: telephonyProviderCodeSchema,
  name: z.string(),
  enabled: z.boolean(),
  isActive: z.boolean(),
  webhookUrl: z.string().optional(),
  hasCredentials: z.object({
    apiKey: z.boolean(),
    accountSid: z.boolean(),
    authToken: z.boolean(),
    apiSecret: z.boolean(),
  }),
  hasWebhookSecret: z.boolean(),
  settings: telephonyProviderSettingsSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}).describe('Ответ с данными провайдера телефонии');

export const telephonyProvidersListResponseSchema = z.array(telephonyProviderResponseSchema)
  .describe('Список провайдеров телефонии');

// === Validation Result Schema ===

export const credentialsValidationResultSchema = z.object({
  valid: z.boolean(),
  error: z.string().optional(),
  accountInfo: z.object({
    balance: z.number().optional(),
    currency: z.string().optional(),
    accountName: z.string().optional(),
  }).optional(),
}).describe('Результат валидации credentials');

// === Input Types ===

export type TelephonyProviderCode = z.infer<typeof telephonyProviderCodeSchema>;
export type TelephonyCredentials = z.infer<typeof telephonyCredentialsSchema>;
export type TelephonyProviderSettings = z.infer<typeof telephonyProviderSettingsSchema>;
export type CreateTelephonyProviderInput = z.infer<typeof createTelephonyProviderSchema>;
export type UpdateTelephonyProviderInput = z.infer<typeof updateTelephonyProviderSchema>;
export type TelephonyProviderResponseType = z.infer<typeof telephonyProviderResponseSchema>;
export type CredentialsValidationResultType = z.infer<typeof credentialsValidationResultSchema>;
