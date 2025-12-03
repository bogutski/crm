import { z } from 'zod';

// === Enums ===

export const projectStatusSchema = z.enum(['active', 'completed', 'on_hold', 'cancelled'])
  .describe('Статус проекта');

// === Input schemas (request body) ===

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').describe('Название проекта'),
  description: z.string().optional().describe('Описание проекта'),
  status: projectStatusSchema.optional().default('active').describe('Статус проекта'),
  deadline: z.coerce.date().optional().describe('Дедлайн проекта'),
}).describe('Данные для создания проекта');

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').optional().describe('Название проекта'),
  description: z.string().optional().nullable().describe('Описание проекта'),
  status: projectStatusSchema.optional().describe('Статус проекта'),
  deadline: z.coerce.date().optional().nullable().describe('Дедлайн проекта'),
}).describe('Данные для обновления проекта');

export const projectFiltersSchema = z.object({
  search: z.string().optional().describe('Поиск по названию и описанию'),
  status: projectStatusSchema.optional().describe('Фильтр по статусу'),
  ownerId: z.string().optional().describe('ID владельца проекта'),
  deadlineFrom: z.coerce.date().optional().describe('Дедлайн от'),
  deadlineTo: z.coerce.date().optional().describe('Дедлайн до'),
  page: z.coerce.number().int().positive().optional().default(1).describe('Номер страницы'),
  limit: z.coerce.number().int().positive().max(100).optional().default(30).describe('Количество на странице (макс. 100)'),
}).describe('Фильтры для списка проектов');

// === Response schemas ===

export const projectOwnerResponseSchema = z.object({
  id: z.string().describe('ID владельца'),
  name: z.string().describe('Имя владельца'),
  email: z.string().describe('Email владельца'),
}).describe('Владелец проекта');

export const projectResponseSchema = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  name: z.string().describe('Название проекта'),
  description: z.string().optional().describe('Описание проекта'),
  status: projectStatusSchema.describe('Статус проекта'),
  deadline: z.coerce.date().optional().describe('Дедлайн проекта'),
  owner: projectOwnerResponseSchema.nullable().optional().describe('Владелец проекта'),
  createdAt: z.coerce.date().describe('Дата создания'),
  updatedAt: z.coerce.date().describe('Дата обновления'),
}).describe('Проект');

export const projectsListResponseSchema = z.object({
  projects: z.array(projectResponseSchema).describe('Список проектов'),
  total: z.number().describe('Общее количество'),
  page: z.number().describe('Текущая страница'),
  limit: z.number().describe('Размер страницы'),
}).describe('Список проектов с пагинацией');

// === Input Types ===

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectFiltersInput = z.infer<typeof projectFiltersSchema>;
