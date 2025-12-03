import { z } from 'zod';
import { LINE_CAPABILITIES } from './types';

// Regex для E.164 формата
const e164Regex = /^\+[1-9]\d{1,14}$/;

// === Input schemas ===

export const createUserPhoneLineSchema = z.object({
  userId: z.string()
    .min(1, 'ID пользователя обязателен')
    .describe('ID пользователя'),
  providerId: z.string()
    .min(1, 'ID провайдера обязателен')
    .describe('ID провайдера телефонии'),
  phoneNumber: z.string()
    .min(1, 'Номер телефона обязателен')
    .regex(e164Regex, 'Номер должен быть в формате E.164 (например, +74951234567)')
    .describe('Номер телефона в формате E.164'),
  displayName: z.string()
    .min(1, 'Название обязательно')
    .max(100, 'Название не должно превышать 100 символов')
    .describe('Отображаемое название линии'),
  capabilities: z.array(z.enum(LINE_CAPABILITIES))
    .optional()
    .default(['voice', 'sms'])
    .describe('Возможности линии'),
  isDefault: z.boolean()
    .optional()
    .default(false)
    .describe('Основная линия для исходящих'),
  isActive: z.boolean()
    .optional()
    .default(true)
    .describe('Активна ли линия'),
  forwardingEnabled: z.boolean()
    .optional()
    .default(false)
    .describe('Включена ли переадресация'),
  forwardTo: z.string()
    .regex(e164Regex, 'Номер должен быть в формате E.164')
    .optional()
    .describe('Номер для переадресации'),
  forwardOnBusy: z.boolean()
    .optional()
    .default(true)
    .describe('Переадресовывать при занятости'),
  forwardOnNoAnswer: z.boolean()
    .optional()
    .default(true)
    .describe('Переадресовывать при отсутствии ответа'),
  forwardOnOffline: z.boolean()
    .optional()
    .default(true)
    .describe('Переадресовывать при офлайн'),
  forwardAfterRings: z.number()
    .min(1, 'Минимум 1 гудок')
    .max(10, 'Максимум 10 гудков')
    .optional()
    .default(3)
    .describe('Количество гудков до переадресации'),
}).describe('Данные для создания телефонной линии');

export const updateUserPhoneLineSchema = z.object({
  displayName: z.string()
    .min(1)
    .max(100)
    .optional()
    .describe('Отображаемое название линии'),
  capabilities: z.array(z.enum(LINE_CAPABILITIES))
    .optional()
    .describe('Возможности линии'),
  isDefault: z.boolean()
    .optional()
    .describe('Основная линия для исходящих'),
  isActive: z.boolean()
    .optional()
    .describe('Активна ли линия'),
  forwardingEnabled: z.boolean()
    .optional()
    .describe('Включена ли переадресация'),
  forwardTo: z.string()
    .regex(e164Regex, 'Номер должен быть в формате E.164')
    .optional()
    .nullable()
    .describe('Номер для переадресации'),
  forwardOnBusy: z.boolean()
    .optional()
    .describe('Переадресовывать при занятости'),
  forwardOnNoAnswer: z.boolean()
    .optional()
    .describe('Переадресовывать при отсутствии ответа'),
  forwardOnOffline: z.boolean()
    .optional()
    .describe('Переадресовывать при офлайн'),
  forwardAfterRings: z.number()
    .min(1)
    .max(10)
    .optional()
    .describe('Количество гудков до переадресации'),
}).describe('Данные для обновления телефонной линии');

export const searchUserPhoneLinesSchema = z.object({
  userId: z.string().optional().describe('Фильтр по пользователю'),
  providerId: z.string().optional().describe('Фильтр по провайдеру'),
  isActive: z.boolean().optional().describe('Фильтр по активности'),
  includeInactive: z.boolean().optional().default(false).describe('Включить неактивные'),
  capability: z.enum(LINE_CAPABILITIES).optional().describe('Фильтр по возможности'),
}).describe('Параметры поиска телефонных линий');

// === Response schemas ===

export const userPhoneLineResponseSchema = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  userId: z.string().describe('ID пользователя'),
  providerId: z.string().describe('ID провайдера'),
  providerName: z.string().optional().describe('Название провайдера'),
  providerType: z.string().optional().describe('Тип провайдера'),
  phoneNumber: z.string().describe('Номер телефона'),
  displayName: z.string().describe('Название линии'),
  capabilities: z.array(z.enum(LINE_CAPABILITIES)).describe('Возможности'),
  isDefault: z.boolean().describe('Основная линия'),
  isActive: z.boolean().describe('Активна'),
  forwardingEnabled: z.boolean().describe('Переадресация включена'),
  forwardTo: z.string().optional().describe('Номер переадресации'),
  forwardOnBusy: z.boolean().describe('Переадресация при занятости'),
  forwardOnNoAnswer: z.boolean().describe('Переадресация при отсутствии ответа'),
  forwardOnOffline: z.boolean().describe('Переадресация при офлайн'),
  forwardAfterRings: z.number().describe('Гудков до переадресации'),
  lastInboundCall: z.coerce.date().optional().describe('Последний входящий'),
  lastOutboundCall: z.coerce.date().optional().describe('Последний исходящий'),
  totalInboundCalls: z.number().describe('Всего входящих'),
  totalOutboundCalls: z.number().describe('Всего исходящих'),
  createdAt: z.coerce.date().describe('Дата создания'),
  updatedAt: z.coerce.date().describe('Дата обновления'),
}).describe('Телефонная линия');

export const userPhoneLineListResponseSchema = z.object({
  lines: z.array(userPhoneLineResponseSchema).describe('Список линий'),
  total: z.number().describe('Общее количество'),
}).describe('Список телефонных линий');

// === Input Types ===

export type CreateUserPhoneLineInput = z.infer<typeof createUserPhoneLineSchema>;
export type UpdateUserPhoneLineInput = z.infer<typeof updateUserPhoneLineSchema>;
export type SearchUserPhoneLinesInput = z.infer<typeof searchUserPhoneLinesSchema>;
