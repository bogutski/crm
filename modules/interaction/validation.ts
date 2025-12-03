import { z } from 'zod';

// === Enums ===

export const interactionDirectionSchema = z.enum(['inbound', 'outbound'])
  .describe('Направление: inbound - входящее, outbound - исходящее');

export const interactionStatusSchema = z.enum(['pending', 'sent', 'delivered', 'read', 'failed'])
  .describe('Статус: pending - ожидает, sent - отправлено, delivered - доставлено, read - прочитано, failed - ошибка');

// === Input schemas (request body) ===

export const createInteractionSchema = z.object({
  channelId: z.string()
    .min(1, 'ID канала обязателен')
    .describe('ID канала коммуникации'),
  contactId: z.string()
    .min(1, 'ID контакта обязателен')
    .describe('ID контакта'),
  opportunityId: z.string()
    .optional()
    .describe('ID сделки (опционально)'),
  direction: interactionDirectionSchema
    .describe('Направление взаимодействия'),
  status: interactionStatusSchema
    .optional()
    .default('pending')
    .describe('Статус'),
  subject: z.string()
    .max(200, 'Тема не должна превышать 200 символов')
    .optional()
    .describe('Тема (для email)'),
  content: z.string()
    .min(1, 'Содержимое обязательно')
    .describe('Содержимое сообщения'),
  duration: z.number()
    .int()
    .min(0)
    .optional()
    .describe('Длительность в секундах (для звонков)'),
  recordingUrl: z.string()
    .url('Некорректный URL записи')
    .optional()
    .describe('URL записи (для звонков)'),
  metadata: z.record(z.string(), z.unknown())
    .optional()
    .default({})
    .describe('Дополнительные данные'),
}).describe('Данные для создания взаимодействия');

export const updateInteractionSchema = z.object({
  status: interactionStatusSchema
    .optional()
    .describe('Статус'),
  subject: z.string()
    .max(200)
    .optional()
    .describe('Тема'),
  content: z.string()
    .min(1)
    .optional()
    .describe('Содержимое'),
  duration: z.number()
    .int()
    .min(0)
    .optional()
    .describe('Длительность в секундах'),
  recordingUrl: z.string()
    .url()
    .optional()
    .describe('URL записи'),
  metadata: z.record(z.string(), z.unknown())
    .optional()
    .describe('Дополнительные данные'),
}).describe('Данные для обновления взаимодействия');

// === Query schemas ===

export const interactionFiltersSchema = z.object({
  contactId: z.string().optional().describe('Фильтр по контакту'),
  channelId: z.string().optional().describe('Фильтр по каналу'),
  opportunityId: z.string().optional().describe('Фильтр по сделке'),
  direction: interactionDirectionSchema.optional().describe('Фильтр по направлению'),
  status: interactionStatusSchema.optional().describe('Фильтр по статусу'),
  dateFrom: z.coerce.date().optional().describe('Дата от'),
  dateTo: z.coerce.date().optional().describe('Дата до'),
  limit: z.number().int().min(1).max(100).optional().default(50).describe('Лимит'),
  offset: z.number().int().min(0).optional().default(0).describe('Смещение'),
}).describe('Фильтры для поиска взаимодействий');

// === Response schemas ===

export const interactionChannelSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
}).describe('Канал (embedded)');

export const interactionContactSchema = z.object({
  id: z.string(),
  name: z.string(),
}).describe('Контакт (embedded)');

export const interactionResponseSchema = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  channelId: z.string().describe('ID канала'),
  contactId: z.string().describe('ID контакта'),
  opportunityId: z.string().optional().describe('ID сделки'),
  direction: interactionDirectionSchema.describe('Направление'),
  status: interactionStatusSchema.describe('Статус'),
  subject: z.string().optional().describe('Тема'),
  content: z.string().describe('Содержимое'),
  duration: z.number().optional().describe('Длительность'),
  recordingUrl: z.string().optional().describe('URL записи'),
  metadata: z.record(z.string(), z.unknown()).describe('Метаданные'),
  createdAt: z.coerce.date().describe('Дата создания'),
  createdBy: z.string().optional().describe('Создатель'),
  channel: interactionChannelSchema.optional().describe('Канал'),
  contact: interactionContactSchema.optional().describe('Контакт'),
}).describe('Взаимодействие');

export const interactionListResponseSchema = z.object({
  interactions: z.array(interactionResponseSchema).describe('Список взаимодействий'),
  total: z.number().describe('Общее количество'),
}).describe('Список взаимодействий');

// === Input Types ===

export type CreateInteractionInput = z.infer<typeof createInteractionSchema>;
export type UpdateInteractionInput = z.infer<typeof updateInteractionSchema>;
export type InteractionFiltersInput = z.infer<typeof interactionFiltersSchema>;
