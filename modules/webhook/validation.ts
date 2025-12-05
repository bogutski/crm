import { z } from 'zod';
import { WEBHOOK_EVENTS } from './types';

// === Вспомогательные схемы ===

const webhookHeaderSchema = z.object({
  key: z.string().min(1, 'Ключ заголовка обязателен').max(100, 'Максимум 100 символов'),
  value: z.string().max(1000, 'Максимум 1000 символов'),
}).describe('HTTP заголовок');

const webhookMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).describe('HTTP метод');

const webhookEventSchema = z.enum(WEBHOOK_EVENTS as unknown as [string, ...string[]]).describe('Событие webhook');

// === Input schemas (request body) ===

export const createWebhookSchema = z.object({
  name: z.string()
    .min(1, 'Название обязательно')
    .max(100, 'Максимум 100 символов')
    .describe('Название webhook'),
  url: z.string()
    .url('Некорректный URL')
    .max(2000, 'Максимум 2000 символов')
    .describe('URL для отправки запроса'),
  method: webhookMethodSchema.optional().default('POST'),
  headers: z.array(webhookHeaderSchema).optional().default([]).describe('Дополнительные HTTP заголовки'),
  events: z.array(webhookEventSchema)
    .min(1, 'Выберите хотя бы одно событие')
    .describe('Список событий для подписки'),
  isActive: z.boolean().optional().default(true).describe('Активен ли webhook'),
}).describe('Данные для создания webhook');

export const updateWebhookSchema = z.object({
  name: z.string()
    .min(1, 'Название обязательно')
    .max(100, 'Максимум 100 символов')
    .optional()
    .describe('Название webhook'),
  url: z.string()
    .url('Некорректный URL')
    .max(2000, 'Максимум 2000 символов')
    .optional()
    .describe('URL для отправки запроса'),
  method: webhookMethodSchema.optional(),
  headers: z.array(webhookHeaderSchema).optional().describe('Дополнительные HTTP заголовки'),
  events: z.array(webhookEventSchema)
    .min(1, 'Выберите хотя бы одно событие')
    .optional()
    .describe('Список событий для подписки'),
  isActive: z.boolean().optional().describe('Активен ли webhook'),
}).describe('Данные для обновления webhook');

export const webhookFiltersSchema = z.object({
  search: z.string().optional().describe('Поиск по названию'),
  isActive: z.coerce.boolean().optional().describe('Фильтр по статусу активности'),
  page: z.coerce.number().int().positive().optional().default(1).describe('Номер страницы'),
  limit: z.coerce.number().int().positive().max(100).optional().default(20).describe('Количество на странице'),
}).describe('Фильтры для списка webhooks');

export const webhookLogFiltersSchema = z.object({
  event: z.string().optional().describe('Фильтр по событию'),
  success: z.coerce.boolean().optional().describe('Фильтр по успешности'),
  page: z.coerce.number().int().positive().optional().default(1).describe('Номер страницы'),
  limit: z.coerce.number().int().positive().max(100).optional().default(20).describe('Количество на странице'),
}).describe('Фильтры для логов webhook');

// === Response schemas ===

export const webhookHeaderResponseSchema = z.object({
  key: z.string().describe('Ключ заголовка'),
  value: z.string().describe('Значение заголовка'),
}).describe('HTTP заголовок');

export const webhookResponseSchema = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  name: z.string().describe('Название'),
  url: z.string().describe('URL'),
  method: webhookMethodSchema,
  headers: z.array(webhookHeaderResponseSchema).describe('HTTP заголовки'),
  events: z.array(z.string()).describe('Подписанные события'),
  isActive: z.boolean().describe('Активен ли webhook'),
  createdAt: z.coerce.date().describe('Дата создания'),
  updatedAt: z.coerce.date().describe('Дата обновления'),
}).describe('Webhook');

export const webhooksListResponseSchema = z.object({
  webhooks: z.array(webhookResponseSchema).describe('Список webhooks'),
  total: z.number().describe('Общее количество'),
  page: z.number().describe('Текущая страница'),
  limit: z.number().describe('Размер страницы'),
}).describe('Список webhooks с пагинацией');

export const webhookLogResponseSchema = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  webhookId: z.string().describe('ID webhook'),
  webhookName: z.string().describe('Название webhook'),
  event: z.string().describe('Событие'),
  url: z.string().describe('URL запроса'),
  method: z.string().describe('HTTP метод'),
  requestHeaders: z.record(z.string()).describe('Заголовки запроса'),
  requestBody: z.unknown().nullable().describe('Тело запроса'),
  responseStatus: z.number().nullable().describe('HTTP статус ответа'),
  responseBody: z.string().nullable().describe('Тело ответа'),
  error: z.string().nullable().describe('Ошибка'),
  duration: z.number().describe('Длительность в мс'),
  success: z.boolean().describe('Успешно ли'),
  createdAt: z.coerce.date().describe('Дата'),
}).describe('Лог webhook');

export const webhookLogsListResponseSchema = z.object({
  logs: z.array(webhookLogResponseSchema).describe('Список логов'),
  total: z.number().describe('Общее количество'),
  page: z.number().describe('Текущая страница'),
  limit: z.number().describe('Размер страницы'),
}).describe('Список логов webhook с пагинацией');

export const webhookEventsResponseSchema = z.object({
  events: z.array(z.object({
    entity: z.string().describe('Сущность'),
    entityLabel: z.string().describe('Название сущности'),
    items: z.array(z.object({
      event: z.string().describe('Код события'),
      label: z.string().describe('Название события'),
    })).describe('События'),
  })).describe('Группированные события'),
}).describe('Доступные события для webhook');

// === Input Types ===

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
export type WebhookFiltersInput = z.infer<typeof webhookFiltersSchema>;
export type WebhookLogFiltersInput = z.infer<typeof webhookLogFiltersSchema>;
