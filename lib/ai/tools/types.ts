import { z } from 'zod';

// ==================== TOOL CATEGORIES ====================

export type ToolCategory = 'analytics' | 'actions';

// ==================== TOOL DEFINITIONS ====================

export interface AIToolDefinition {
  name: string;
  displayName: string;
  description: string;
  category: ToolCategory;
  enabled: boolean;
  dangerous?: boolean; // Requires extra caution (modifies data)
}

// All available tools with their metadata
export const AI_TOOLS_REGISTRY: Record<string, AIToolDefinition> = {
  // Analytics tools (read-only)
  search_contacts: {
    name: 'search_contacts',
    displayName: 'Поиск контактов',
    description: 'Поиск контактов по имени, email, компании или телефону',
    category: 'analytics',
    enabled: true,
  },
  get_opportunities_stats: {
    name: 'get_opportunities_stats',
    displayName: 'Статистика сделок',
    description: 'Получение статистики по сделкам: общая сумма, количество по стадиям, воронка',
    category: 'analytics',
    enabled: true,
  },
  get_tasks_overview: {
    name: 'get_tasks_overview',
    displayName: 'Обзор задач',
    description: 'Просмотр задач: просроченные, по статусам, назначенные',
    category: 'analytics',
    enabled: true,
  },
  get_pipeline_analytics: {
    name: 'get_pipeline_analytics',
    displayName: 'Аналитика воронки',
    description: 'Анализ воронки продаж: конверсия по стадиям, средний чек, время в стадии',
    category: 'analytics',
    enabled: true,
  },
  search_opportunities: {
    name: 'search_opportunities',
    displayName: 'Поиск сделок',
    description: 'Поиск сделок по названию, сумме, дате закрытия и другим параметрам',
    category: 'analytics',
    enabled: true,
  },
  get_contact_details: {
    name: 'get_contact_details',
    displayName: 'Детали контакта',
    description: 'Получение полной информации о контакте включая историю взаимодействий',
    category: 'analytics',
    enabled: true,
  },

  // Action tools (write operations)
  create_task: {
    name: 'create_task',
    displayName: 'Создание задачи',
    description: 'Создание новой задачи с указанием срока, приоритета и исполнителя',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  update_opportunity_stage: {
    name: 'update_opportunity_stage',
    displayName: 'Перемещение сделки',
    description: 'Перемещение сделки на другую стадию воронки',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  create_interaction: {
    name: 'create_interaction',
    displayName: 'Запись взаимодействия',
    description: 'Логирование звонка, письма или другого взаимодействия с контактом',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  update_task_status: {
    name: 'update_task_status',
    displayName: 'Изменение статуса задачи',
    description: 'Изменение статуса задачи (выполнена, в работе, отменена)',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
};

// ==================== ZOD SCHEMAS FOR TOOL PARAMETERS ====================

// Search contacts
export const searchContactsSchema = z.object({
  query: z.string().describe('Поисковый запрос: имя, email, телефон или компания'),
  limit: z.number().min(1).max(20).default(10).describe('Максимальное количество результатов'),
});

// Get opportunities stats
export const getOpportunitiesStatsSchema = z.object({
  pipelineId: z.string().optional().describe('ID воронки для фильтрации (опционально)'),
  includeArchived: z.boolean().default(false).describe('Включить архивные сделки'),
  dateFrom: z.string().optional().describe('Дата начала периода в формате YYYY-MM-DD'),
  dateTo: z.string().optional().describe('Дата окончания периода в формате YYYY-MM-DD'),
});

// Get tasks overview
export const getTasksOverviewSchema = z.object({
  status: z.enum(['all', 'open', 'in_progress', 'completed', 'cancelled', 'overdue']).default('all').describe('Фильтр по статусу'),
  assigneeId: z.string().optional().describe('ID исполнителя для фильтрации'),
  limit: z.number().min(1).max(50).default(20).describe('Максимальное количество результатов'),
});

// Get pipeline analytics
export const getPipelineAnalyticsSchema = z.object({
  pipelineId: z.string().optional().describe('ID воронки (если не указан - используется воронка по умолчанию)'),
});

// Search opportunities
export const searchOpportunitiesSchema = z.object({
  query: z.string().optional().describe('Поисковый запрос по названию сделки'),
  minAmount: z.number().optional().describe('Минимальная сумма сделки'),
  maxAmount: z.number().optional().describe('Максимальная сумма сделки'),
  stageId: z.string().optional().describe('ID стадии для фильтрации'),
  closingDateFrom: z.string().optional().describe('Дата закрытия от (YYYY-MM-DD)'),
  closingDateTo: z.string().optional().describe('Дата закрытия до (YYYY-MM-DD)'),
  limit: z.number().min(1).max(20).default(10).describe('Максимальное количество результатов'),
});

// Get contact details
export const getContactDetailsSchema = z.object({
  contactId: z.string().describe('ID контакта'),
  includeInteractions: z.boolean().default(true).describe('Включить историю взаимодействий'),
  includeOpportunities: z.boolean().default(true).describe('Включить связанные сделки'),
});

// Create task
export const createTaskSchema = z.object({
  title: z.string().min(1).describe('Название задачи'),
  description: z.string().optional().describe('Описание задачи'),
  dueDate: z.string().optional().describe('Срок выполнения в формате YYYY-MM-DD'),
  priorityId: z.string().optional().describe('ID приоритета из справочника'),
  assigneeId: z.string().optional().describe('ID исполнителя'),
  linkedEntityType: z.enum(['contact', 'project']).optional().describe('Тип связанной сущности'),
  linkedEntityId: z.string().optional().describe('ID связанной сущности'),
});

// Update opportunity stage
export const updateOpportunityStageSchema = z.object({
  opportunityId: z.string().describe('ID сделки'),
  stageId: z.string().describe('ID новой стадии'),
});

// Create interaction
export const createInteractionSchema = z.object({
  contactId: z.string().describe('ID контакта'),
  channelCode: z.string().describe('Код канала: phone, email, meeting, etc.'),
  direction: z.enum(['inbound', 'outbound']).describe('Направление: входящее или исходящее'),
  subject: z.string().optional().describe('Тема взаимодействия'),
  content: z.string().describe('Содержание/описание взаимодействия'),
  opportunityId: z.string().optional().describe('ID связанной сделки'),
});

// Update task status
export const updateTaskStatusSchema = z.object({
  taskId: z.string().describe('ID задачи'),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).describe('Новый статус задачи'),
});

// ==================== TYPE EXPORTS ====================

export type SearchContactsParams = z.infer<typeof searchContactsSchema>;
export type GetOpportunitiesStatsParams = z.infer<typeof getOpportunitiesStatsSchema>;
export type GetTasksOverviewParams = z.infer<typeof getTasksOverviewSchema>;
export type GetPipelineAnalyticsParams = z.infer<typeof getPipelineAnalyticsSchema>;
export type SearchOpportunitiesParams = z.infer<typeof searchOpportunitiesSchema>;
export type GetContactDetailsParams = z.infer<typeof getContactDetailsSchema>;
export type CreateTaskParams = z.infer<typeof createTaskSchema>;
export type UpdateOpportunityStageParams = z.infer<typeof updateOpportunityStageSchema>;
export type CreateInteractionParams = z.infer<typeof createInteractionSchema>;
export type UpdateTaskStatusParams = z.infer<typeof updateTaskStatusSchema>;
