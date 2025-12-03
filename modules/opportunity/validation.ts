import { z } from 'zod';

// === UTM Schema ===

export const utmSchema = z.object({
  source: z.string().optional().describe('UTM source (google, facebook, newsletter)'),
  medium: z.string().optional().describe('UTM medium (cpc, email, social, organic)'),
  campaign: z.string().optional().describe('UTM campaign name'),
  term: z.string().optional().describe('UTM term (keyword)'),
  content: z.string().optional().describe('UTM content (A/B test variant)'),
}).describe('UTM метки');

// === Input schemas (request body) ===

export const createOpportunitySchema = z.object({
  name: z.string().optional().describe('Название сделки'),
  amount: z.number().min(0, 'Сумма должна быть положительной').optional().describe('Сумма сделки'),
  closingDate: z.coerce.date().optional().describe('Дата закрытия'),
  utm: utmSchema.optional().describe('UTM метки'),
  description: z.string().optional().describe('Описание сделки'),
  externalId: z.string().optional().describe('Внешний идентификатор'),
  archived: z.boolean().optional().default(false).describe('Архивирована'),
  contactId: z.string().optional().describe('ID связанного контакта'),
  ownerId: z.string().optional().describe('ID владельца'),
  priorityId: z.string().optional().describe('ID приоритета (из словаря)'),
  pipelineId: z.string().optional().describe('ID воронки'),
  stageId: z.string().optional().describe('ID этапа воронки'),
}).describe('Данные для создания сделки');

export const updateOpportunitySchema = z.object({
  name: z.string().optional().nullable().describe('Название сделки'),
  amount: z.number().min(0, 'Сумма должна быть положительной').optional().nullable().describe('Сумма сделки'),
  closingDate: z.coerce.date().optional().nullable().describe('Дата закрытия'),
  utm: utmSchema.optional().nullable().describe('UTM метки'),
  description: z.string().optional().nullable().describe('Описание сделки'),
  externalId: z.string().optional().nullable().describe('Внешний идентификатор'),
  archived: z.boolean().optional().describe('Архивирована'),
  contactId: z.string().optional().nullable().describe('ID связанного контакта'),
  ownerId: z.string().optional().nullable().describe('ID владельца'),
  priorityId: z.string().optional().nullable().describe('ID приоритета (из словаря)'),
  pipelineId: z.string().optional().nullable().describe('ID воронки'),
  stageId: z.string().optional().nullable().describe('ID этапа воронки'),
}).describe('Данные для обновления сделки');

export const opportunityFiltersSchema = z.object({
  search: z.string().optional().describe('Поиск по названию и описанию'),
  archived: z.coerce.boolean().optional().describe('Фильтр по архивации'),
  ownerId: z.string().optional().describe('ID владельца'),
  contactId: z.string().optional().describe('ID контакта'),
  priorityId: z.string().optional().describe('ID приоритета'),
  pipelineId: z.string().optional().describe('ID воронки'),
  stageId: z.string().optional().describe('ID этапа'),
  minAmount: z.coerce.number().optional().describe('Минимальная сумма'),
  maxAmount: z.coerce.number().optional().describe('Максимальная сумма'),
  closingDateFrom: z.coerce.date().optional().describe('Дата закрытия от'),
  closingDateTo: z.coerce.date().optional().describe('Дата закрытия до'),
  page: z.coerce.number().int().positive().optional().default(1).describe('Номер страницы'),
  limit: z.coerce.number().int().positive().max(100).optional().default(20).describe('Количество на странице (макс. 100)'),
}).describe('Фильтры для списка сделок');

// === Response schemas ===

export const opportunityPriorityResponseSchema = z.object({
  id: z.string().describe('ID приоритета'),
  name: z.string().describe('Название'),
  color: z.string().optional().describe('Цвет'),
}).describe('Приоритет сделки');

export const opportunityPipelineResponseSchema = z.object({
  id: z.string().describe('ID воронки'),
  name: z.string().describe('Название воронки'),
  code: z.string().describe('Код воронки'),
}).describe('Воронка сделки');

export const opportunityStageResponseSchema = z.object({
  id: z.string().describe('ID этапа'),
  name: z.string().describe('Название этапа'),
  color: z.string().describe('Цвет'),
  order: z.number().describe('Порядок'),
  probability: z.number().describe('Вероятность закрытия'),
  isInitial: z.boolean().describe('Начальный этап'),
  isFinal: z.boolean().describe('Финальный этап'),
  isWon: z.boolean().describe('Успешное закрытие'),
}).describe('Этап воронки');

export const opportunityContactResponseSchema = z.object({
  id: z.string().describe('ID контакта'),
  name: z.string().describe('Имя контакта'),
}).describe('Контакт сделки');

export const opportunityOwnerResponseSchema = z.object({
  id: z.string().describe('ID владельца'),
  name: z.string().describe('Имя владельца'),
  email: z.string().describe('Email владельца'),
}).describe('Владелец сделки');

export const opportunityResponseSchema = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  name: z.string().optional().describe('Название'),
  amount: z.number().optional().describe('Сумма'),
  closingDate: z.coerce.date().optional().describe('Дата закрытия'),
  utm: utmSchema.optional().describe('UTM метки'),
  description: z.string().optional().describe('Описание'),
  externalId: z.string().optional().describe('Внешний идентификатор'),
  archived: z.boolean().describe('Архивирована'),
  contact: opportunityContactResponseSchema.optional().nullable().describe('Контакт'),
  owner: opportunityOwnerResponseSchema.optional().nullable().describe('Владелец'),
  priority: opportunityPriorityResponseSchema.optional().nullable().describe('Приоритет'),
  pipeline: opportunityPipelineResponseSchema.optional().nullable().describe('Воронка'),
  stage: opportunityStageResponseSchema.optional().nullable().describe('Этап'),
  createdAt: z.coerce.date().describe('Дата создания'),
  updatedAt: z.coerce.date().describe('Дата обновления'),
}).describe('Сделка');

export const opportunitiesListResponseSchema = z.object({
  opportunities: z.array(opportunityResponseSchema).describe('Список сделок'),
  total: z.number().describe('Общее количество'),
  page: z.number().describe('Текущая страница'),
  limit: z.number().describe('Размер страницы'),
}).describe('Список сделок с пагинацией');

// === Form schema (for frontend validation) ===

export const opportunityFormSchema = z.object({
  name: z.string().optional(),
  amount: z.number().optional(),
  closingDate: z.string().optional(),
  description: z.string().optional(),
  externalId: z.string().optional(),
  archived: z.boolean().optional(),
  contactId: z.string().optional(),
  priorityId: z.string().optional(),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  utm: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
    term: z.string().optional(),
    content: z.string().optional(),
  }).optional(),
});

export type OpportunityFormData = z.infer<typeof opportunityFormSchema>;

// === Input Types (для валидации запросов) ===

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type OpportunityFiltersInput = z.infer<typeof opportunityFiltersSchema>;
