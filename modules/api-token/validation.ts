import { z } from 'zod';

// === Input schemas (request body) ===

export const createApiTokenSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(100, 'Максимум 100 символов').describe('Название токена'),
}).describe('Данные для создания API токена');

export const updateApiTokenSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(100, 'Максимум 100 символов').optional().describe('Название токена'),
}).describe('Данные для обновления API токена');

export const apiTokenFiltersSchema = z.object({
  search: z.string().optional().describe('Поиск по названию'),
  page: z.coerce.number().int().positive().optional().default(1).describe('Номер страницы'),
  limit: z.coerce.number().int().positive().max(100).optional().default(20).describe('Количество на странице (макс. 100)'),
}).describe('Фильтры для списка API токенов');

// === Response schemas ===

export const apiTokenResponseSchema = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  name: z.string().describe('Название токена'),
  tokenPrefix: z.string().describe('Префикс токена (для идентификации)'),
  lastUsedAt: z.coerce.date().optional().describe('Дата последнего использования'),
  createdAt: z.coerce.date().describe('Дата создания'),
  updatedAt: z.coerce.date().describe('Дата обновления'),
}).describe('API токен');

export const apiTokenCreatedResponseSchema = apiTokenResponseSchema.extend({
  token: z.string().describe('Полный токен (показывается только при создании)'),
}).describe('Созданный API токен');

export const apiTokensListResponseSchema = z.object({
  tokens: z.array(apiTokenResponseSchema).describe('Список токенов'),
  total: z.number().describe('Общее количество'),
  page: z.number().describe('Текущая страница'),
  limit: z.number().describe('Размер страницы'),
}).describe('Список API токенов с пагинацией');

// === Input Types ===

export type CreateApiTokenInput = z.infer<typeof createApiTokenSchema>;
export type UpdateApiTokenInput = z.infer<typeof updateApiTokenSchema>;
export type ApiTokenFiltersInput = z.infer<typeof apiTokenFiltersSchema>;
