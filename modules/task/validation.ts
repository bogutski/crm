import { z } from 'zod';

// === Enums ===

export const taskStatusSchema = z.enum(['open', 'in_progress', 'completed', 'cancelled'])
  .describe('Статус задачи');

export const linkedEntityTypeSchema = z.enum(['contact', 'project'])
  .describe('Тип связанной сущности');

// === Sub-schemas ===

export const linkedToSchema = z.object({
  entityType: linkedEntityTypeSchema.describe('Тип сущности'),
  entityId: z.string().describe('ID сущности'),
}).describe('Привязка к сущности');

// === Input schemas (request body) ===

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').describe('Название задачи'),
  description: z.string().optional().describe('Описание задачи'),
  status: taskStatusSchema.optional().default('open').describe('Статус задачи'),
  priorityId: z.string().optional().describe('ID приоритета из словаря'),
  dueDate: z.coerce.date().optional().describe('Срок выполнения'),
  assigneeId: z.string().optional().describe('ID исполнителя'),
  linkedTo: linkedToSchema.optional().describe('Привязка к контакту или проекту'),
}).describe('Данные для создания задачи');

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional().describe('Название задачи'),
  description: z.string().optional().nullable().describe('Описание задачи'),
  status: taskStatusSchema.optional().describe('Статус задачи'),
  priorityId: z.string().optional().nullable().describe('ID приоритета из словаря'),
  dueDate: z.coerce.date().optional().nullable().describe('Срок выполнения'),
  assigneeId: z.string().optional().nullable().describe('ID исполнителя'),
  linkedTo: linkedToSchema.optional().nullable().describe('Привязка к контакту или проекту'),
}).describe('Данные для обновления задачи');

export const taskFiltersSchema = z.object({
  search: z.string().optional().describe('Поиск по названию и описанию'),
  status: taskStatusSchema.optional().describe('Фильтр по статусу'),
  priorityId: z.string().optional().describe('Фильтр по приоритету'),
  assigneeId: z.string().optional().describe('Фильтр по исполнителю'),
  ownerId: z.string().optional().describe('ID владельца задачи'),
  entityType: linkedEntityTypeSchema.optional().describe('Тип связанной сущности'),
  entityId: z.string().optional().describe('ID связанной сущности'),
  dueDateFrom: z.coerce.date().optional().describe('Срок выполнения от'),
  dueDateTo: z.coerce.date().optional().describe('Срок выполнения до'),
  overdue: z.coerce.boolean().optional().describe('Только просроченные'),
  page: z.coerce.number().int().positive().optional().default(1).describe('Номер страницы'),
  limit: z.coerce.number().int().positive().max(100).optional().default(30).describe('Количество на странице (макс. 100)'),
}).describe('Фильтры для списка задач');

// === Response schemas ===

export const taskPriorityResponseSchema = z.object({
  id: z.string().describe('ID приоритета'),
  name: z.string().describe('Название приоритета'),
  color: z.string().optional().describe('Цвет для отображения'),
}).describe('Приоритет задачи');

export const taskAssigneeResponseSchema = z.object({
  id: z.string().describe('ID исполнителя'),
  name: z.string().describe('Имя исполнителя'),
  email: z.string().describe('Email исполнителя'),
}).describe('Исполнитель задачи');

export const linkedEntityResponseSchema = z.object({
  entityType: linkedEntityTypeSchema.describe('Тип сущности'),
  entityId: z.string().describe('ID сущности'),
  name: z.string().describe('Название сущности'),
}).describe('Связанная сущность');

export const taskResponseSchema = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  title: z.string().describe('Название задачи'),
  description: z.string().optional().describe('Описание задачи'),
  status: taskStatusSchema.describe('Статус задачи'),
  priority: taskPriorityResponseSchema.nullable().optional().describe('Приоритет задачи'),
  dueDate: z.coerce.date().optional().describe('Срок выполнения'),
  completedAt: z.coerce.date().optional().describe('Дата завершения'),
  assignee: taskAssigneeResponseSchema.nullable().optional().describe('Исполнитель'),
  linkedTo: linkedEntityResponseSchema.nullable().optional().describe('Привязка к сущности'),
  ownerId: z.string().describe('ID владельца'),
  createdAt: z.coerce.date().describe('Дата создания'),
  updatedAt: z.coerce.date().describe('Дата обновления'),
}).describe('Задача');

export const tasksListResponseSchema = z.object({
  tasks: z.array(taskResponseSchema).describe('Список задач'),
  total: z.number().describe('Общее количество'),
  page: z.number().describe('Текущая страница'),
  limit: z.number().describe('Размер страницы'),
}).describe('Список задач с пагинацией');

// === Input Types ===

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;

// === Form schema (for UI) ===

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priorityId: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  linkedEntityType: linkedEntityTypeSchema.optional(),
  linkedEntityId: z.string().optional(),
});

export type TaskFormData = z.infer<typeof taskFormSchema>;
