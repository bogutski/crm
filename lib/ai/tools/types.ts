import { z } from 'zod';

// ==================== TOOL CATEGORIES ====================

export type ToolCategory = 'analytics' | 'actions' | 'dictionaries' | 'users' | 'projects' | 'utils';

// ==================== TOOL DEFINITIONS ====================

export interface AIToolDefinition {
  name: string;
  displayName: string;
  description: string;
  category: ToolCategory;
  enabled: boolean;
  dangerous?: boolean; // Requires extra caution (modifies data)
}

// All available tools with their metadata - synced with MCP tools
export const AI_TOOLS_REGISTRY: Record<string, AIToolDefinition> = {
  // ==================== КОНТАКТЫ ====================
  search_contacts: {
    name: 'search_contacts',
    displayName: 'Поиск контактов',
    description: 'Поиск контактов по имени, email, компании, телефону или адресу. Можно фильтровать по городу и стране.',
    category: 'analytics',
    enabled: true,
  },
  get_contact_details: {
    name: 'get_contact_details',
    displayName: 'Детали контакта',
    description: 'Получить подробную информацию о контакте по ID',
    category: 'analytics',
    enabled: true,
  },
  create_contact: {
    name: 'create_contact',
    displayName: 'Создание контакта',
    description: 'Создать новый контакт в CRM',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  update_contact: {
    name: 'update_contact',
    displayName: 'Обновление контакта',
    description: 'Обновить данные контакта',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  delete_contact: {
    name: 'delete_contact',
    displayName: 'Удаление контакта',
    description: 'Удалить контакт из CRM',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },

  // ==================== СДЕЛКИ ====================
  search_opportunities: {
    name: 'search_opportunities',
    displayName: 'Поиск сделок',
    description: 'Поиск сделок по названию, контакту или стадии',
    category: 'analytics',
    enabled: true,
  },
  get_opportunity_details: {
    name: 'get_opportunity_details',
    displayName: 'Детали сделки',
    description: 'Получить подробную информацию о сделке по ID',
    category: 'analytics',
    enabled: true,
  },
  get_opportunities_stats: {
    name: 'get_opportunities_stats',
    displayName: 'Статистика сделок',
    description: 'Получить статистику по сделкам: общее количество, сумма, разбивка по стадиям',
    category: 'analytics',
    enabled: true,
  },
  create_opportunity: {
    name: 'create_opportunity',
    displayName: 'Создание сделки',
    description: 'Создать новую сделку в CRM',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  update_opportunity: {
    name: 'update_opportunity',
    displayName: 'Обновление сделки',
    description: 'Обновить данные сделки (название, сумму, заметки и т.д.)',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  update_opportunity_stage: {
    name: 'update_opportunity_stage',
    displayName: 'Перемещение сделки',
    description: 'Переместить сделку на другую стадию воронки',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  delete_opportunity: {
    name: 'delete_opportunity',
    displayName: 'Удаление сделки',
    description: 'Удалить сделку из CRM',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  archive_opportunity: {
    name: 'archive_opportunity',
    displayName: 'Архивация сделки',
    description: 'Архивировать или разархивировать сделку',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },

  // ==================== ЗАДАЧИ ====================
  get_tasks_overview: {
    name: 'get_tasks_overview',
    displayName: 'Обзор задач',
    description: 'Получить обзор задач: количество по статусам и список задач',
    category: 'analytics',
    enabled: true,
  },
  get_task_details: {
    name: 'get_task_details',
    displayName: 'Детали задачи',
    description: 'Получить подробную информацию о задаче по ID',
    category: 'analytics',
    enabled: true,
  },
  create_task: {
    name: 'create_task',
    displayName: 'Создание задачи',
    description: 'Создать новую задачу в CRM. Можно привязать к контакту или сделке',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  update_task: {
    name: 'update_task',
    displayName: 'Обновление задачи',
    description: 'Обновить данные задачи (название, описание, срок и т.д.)',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  update_task_status: {
    name: 'update_task_status',
    displayName: 'Изменение статуса задачи',
    description: 'Изменить статус существующей задачи',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  delete_task: {
    name: 'delete_task',
    displayName: 'Удаление задачи',
    description: 'Удалить задачу из CRM',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  get_tasks_by_contact: {
    name: 'get_tasks_by_contact',
    displayName: 'Задачи контакта',
    description: 'Получить все задачи, привязанные к контакту',
    category: 'analytics',
    enabled: true,
  },
  get_tasks_by_project: {
    name: 'get_tasks_by_project',
    displayName: 'Задачи проекта',
    description: 'Получить все задачи, привязанные к проекту',
    category: 'analytics',
    enabled: true,
  },

  // ==================== ВЗАИМОДЕЙСТВИЯ ====================
  search_interactions: {
    name: 'search_interactions',
    displayName: 'Поиск взаимодействий',
    description: 'Поиск взаимодействий с контактами (звонки, письма, встречи)',
    category: 'analytics',
    enabled: true,
  },
  get_interaction_details: {
    name: 'get_interaction_details',
    displayName: 'Детали взаимодействия',
    description: 'Получить подробную информацию о взаимодействии по ID',
    category: 'analytics',
    enabled: true,
  },
  get_interactions_by_contact: {
    name: 'get_interactions_by_contact',
    displayName: 'Взаимодействия контакта',
    description: 'Получить все взаимодействия с контактом (звонки, письма, встречи)',
    category: 'analytics',
    enabled: true,
  },
  get_interaction_stats: {
    name: 'get_interaction_stats',
    displayName: 'Статистика взаимодействий',
    description: 'Получить статистику взаимодействий по контакту',
    category: 'analytics',
    enabled: true,
  },
  create_interaction: {
    name: 'create_interaction',
    displayName: 'Запись взаимодействия',
    description: 'Записать взаимодействие с контактом (звонок, письмо, встреча и т.д.)',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  update_interaction: {
    name: 'update_interaction',
    displayName: 'Обновление взаимодействия',
    description: 'Обновить данные взаимодействия',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },
  delete_interaction: {
    name: 'delete_interaction',
    displayName: 'Удаление взаимодействия',
    description: 'Удалить взаимодействие из CRM',
    category: 'actions',
    enabled: true,
    dangerous: true,
  },

  // ==================== ВОРОНКИ ====================
  get_pipelines: {
    name: 'get_pipelines',
    displayName: 'Список воронок',
    description: 'Получить список всех воронок продаж',
    category: 'analytics',
    enabled: true,
  },
  get_pipeline_stages: {
    name: 'get_pipeline_stages',
    displayName: 'Стадии воронки',
    description: 'Получить список стадий воронки',
    category: 'analytics',
    enabled: true,
  },
  get_pipeline_analytics: {
    name: 'get_pipeline_analytics',
    displayName: 'Аналитика воронки',
    description: 'Получить аналитику воронки: количество сделок и суммы по стадиям',
    category: 'analytics',
    enabled: true,
  },
  get_default_pipeline: {
    name: 'get_default_pipeline',
    displayName: 'Воронка по умолчанию',
    description: 'Получить воронку по умолчанию со всеми стадиями',
    category: 'analytics',
    enabled: true,
  },
  get_pipeline_by_code: {
    name: 'get_pipeline_by_code',
    displayName: 'Воронка по коду',
    description: 'Получить воронку по её коду со всеми стадиями',
    category: 'analytics',
    enabled: true,
  },
  get_initial_stage: {
    name: 'get_initial_stage',
    displayName: 'Начальная стадия',
    description: 'Получить начальную стадию воронки',
    category: 'analytics',
    enabled: true,
  },

  // ==================== УТИЛИТЫ ====================
  get_current_datetime: {
    name: 'get_current_datetime',
    displayName: 'Текущая дата',
    description: 'Получить текущую дату и время сервера. Используй перед созданием задач если нужно точное время.',
    category: 'utils',
    enabled: true,
  },

  // ==================== СПРАВОЧНИКИ ====================
  search_dictionaries: {
    name: 'search_dictionaries',
    displayName: 'Справочники',
    description: 'Универсальный поиск справочников. Без параметров — все словари с содержимым. С codes — только указанные словари. Возвращает ID элементов для использования в других операциях (priorityId, contactTypeId и т.д.)',
    category: 'dictionaries',
    enabled: true,
  },

  // ==================== КАНАЛЫ ====================
  get_channels: {
    name: 'get_channels',
    displayName: 'Список каналов',
    description: 'Получить список каналов коммуникации (телефон, email, встреча и т.д.)',
    category: 'dictionaries',
    enabled: true,
  },

  // ==================== ПОЛЬЗОВАТЕЛИ ====================
  search_users: {
    name: 'search_users',
    displayName: 'Поиск пользователей',
    description: 'Поиск пользователей CRM (для назначения ответственных)',
    category: 'users',
    enabled: true,
  },
  get_user_details: {
    name: 'get_user_details',
    displayName: 'Детали пользователя',
    description: 'Получить информацию о пользователе по ID',
    category: 'users',
    enabled: true,
  },
  update_user: {
    name: 'update_user',
    displayName: 'Обновление пользователя',
    description: 'Обновить данные пользователя (имя, email, аватар)',
    category: 'users',
    enabled: true,
    dangerous: true,
  },

  // ==================== ПРОЕКТЫ ====================
  search_projects: {
    name: 'search_projects',
    displayName: 'Поиск проектов',
    description: 'Поиск проектов в CRM',
    category: 'projects',
    enabled: true,
  },
  get_project_details: {
    name: 'get_project_details',
    displayName: 'Детали проекта',
    description: 'Получить подробную информацию о проекте по ID',
    category: 'projects',
    enabled: true,
  },
  create_project: {
    name: 'create_project',
    displayName: 'Создание проекта',
    description: 'Создать новый проект в CRM',
    category: 'projects',
    enabled: true,
    dangerous: true,
  },
  update_project: {
    name: 'update_project',
    displayName: 'Обновление проекта',
    description: 'Обновить данные проекта',
    category: 'projects',
    enabled: true,
    dangerous: true,
  },
  delete_project: {
    name: 'delete_project',
    displayName: 'Удаление проекта',
    description: 'Удалить проект из CRM',
    category: 'projects',
    enabled: true,
    dangerous: true,
  },
};

// ==================== ZOD SCHEMAS FOR TOOL PARAMETERS ====================

// КОНТАКТЫ
export const searchContactsSchema = z.object({
  query: z.string().optional().describe('Поисковый запрос: имя, email, телефон, компания или адрес'),
  city: z.string().optional().describe('Фильтр по городу'),
  country: z.string().optional().describe('Фильтр по коду страны ISO (RU, US, KZ и т.д.)'),
  limit: z.number().min(1).max(100).default(10).describe('Максимальное количество результатов'),
});

export const getContactDetailsSchema = z.object({
  contactId: z.string().describe('ID контакта'),
});

export const addressInputSchema = z.object({
  line1: z.string().optional().describe('Улица, дом'),
  line2: z.string().optional().describe('Квартира, офис'),
  city: z.string().optional().describe('Город'),
  state: z.string().optional().describe('Область/регион'),
  zip: z.string().optional().describe('Почтовый индекс'),
  country: z.string().optional().describe('Код страны ISO (RU, US, KZ)'),
});

export const createContactSchema = z.object({
  name: z.string().describe('Имя контакта (обязательно)'),
  company: z.string().optional().describe('Название компании'),
  position: z.string().optional().describe('Должность'),
  email: z.string().optional().describe('Email адрес'),
  phone: z.string().optional().describe('Номер телефона'),
  address: addressInputSchema.optional().describe('Адрес контакта'),
  contactTypeId: z.string().optional().describe('ID типа контакта из словаря'),
  sourceId: z.string().optional().describe('ID источника из словаря'),
  notes: z.string().optional().describe('Заметки о контакте'),
});

export const updateContactSchema = z.object({
  contactId: z.string().describe('ID контакта (обязательно)'),
  name: z.string().optional().describe('Новое имя контакта'),
  company: z.string().optional().describe('Название компании'),
  position: z.string().optional().describe('Должность'),
  notes: z.string().optional().describe('Заметки о контакте'),
});

export const deleteContactSchema = z.object({
  contactId: z.string().describe('ID контакта для удаления'),
});

// СДЕЛКИ
export const searchOpportunitiesSchema = z.object({
  query: z.string().optional().describe('Поисковый запрос по названию сделки'),
  contactId: z.string().optional().describe('Фильтр по ID контакта — показать все сделки этого клиента'),
  ownerId: z.string().optional().describe('Фильтр по ID ответственного менеджера'),
  stageId: z.string().optional().describe('Фильтр по ID стадии'),
  pipelineId: z.string().optional().describe('Фильтр по ID воронки'),
  minAmount: z.number().optional().describe('Минимальная сумма сделки'),
  maxAmount: z.number().optional().describe('Максимальная сумма сделки'),
  closingDateFrom: z.string().optional().describe('Дата закрытия от (ISO дата)'),
  closingDateTo: z.string().optional().describe('Дата закрытия до (ISO дата)'),
  limit: z.number().min(1).max(100).default(10).describe('Максимальное количество результатов'),
});

export const getOpportunityDetailsSchema = z.object({
  opportunityId: z.string().describe('ID сделки'),
});

export const getOpportunitiesStatsSchema = z.object({
  pipelineId: z.string().optional().describe('ID воронки для фильтрации (опционально)'),
});

export const createOpportunitySchema = z.object({
  name: z.string().describe('Название сделки (обязательно)'),
  amount: z.number().optional().describe('Сумма сделки'),
  contactId: z.string().optional().describe('ID контакта для привязки'),
  pipelineId: z.string().optional().describe('ID воронки'),
  stageId: z.string().optional().describe('ID стадии'),
  expectedCloseDate: z.string().optional().describe('Ожидаемая дата закрытия в формате ISO'),
  notes: z.string().optional().describe('Заметки о сделке'),
});

export const updateOpportunitySchema = z.object({
  opportunityId: z.string().describe('ID сделки (обязательно)'),
  name: z.string().optional().describe('Новое название сделки'),
  amount: z.number().optional().describe('Новая сумма сделки'),
  expectedCloseDate: z.string().optional().describe('Новая ожидаемая дата закрытия'),
  notes: z.string().optional().describe('Заметки о сделке'),
});

export const updateOpportunityStageSchema = z.object({
  opportunityId: z.string().describe('ID сделки'),
  stageId: z.string().describe('ID новой стадии'),
});

export const deleteOpportunitySchema = z.object({
  opportunityId: z.string().describe('ID сделки для удаления'),
});

export const archiveOpportunitySchema = z.object({
  opportunityId: z.string().describe('ID сделки'),
  archived: z.boolean().default(true).describe('true - архивировать, false - разархивировать'),
});

// ЗАДАЧИ
export const getTasksOverviewSchema = z.object({
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional().describe('Фильтр по статусу'),
  assigneeId: z.string().optional().describe('Фильтр по ID исполнителя (на кого назначена задача)'),
  ownerId: z.string().optional().describe('Фильтр по ID создателя задачи'),
  dueDateFrom: z.string().optional().describe('Срок выполнения от (ISO дата)'),
  dueDateTo: z.string().optional().describe('Срок выполнения до (ISO дата)'),
  overdue: z.boolean().optional().describe('Показать только просроченные задачи (срок прошёл, задача не завершена)'),
  limit: z.number().min(1).max(50).default(10).describe('Максимальное количество задач'),
});

export const getTaskDetailsSchema = z.object({
  taskId: z.string().describe('ID задачи'),
});

export const createTaskSchema = z.object({
  title: z.string().describe('Название задачи (обязательно)'),
  description: z.string().optional().describe('Описание задачи'),
  dueDate: z.string().optional().describe('Срок выполнения в формате ISO (например, 2025-12-31). Дата должна быть в будущем!'),
  priorityId: z.string().optional().describe('ID приоритета задачи из словаря task_priorities'),
  assigneeId: z.string().optional().describe('ID исполнителя (пользователя) — на кого назначить задачу'),
  contactId: z.string().optional().describe('Привязать задачу к контакту (клиенту)'),
});

export const updateTaskSchema = z.object({
  taskId: z.string().describe('ID задачи (обязательно)'),
  title: z.string().optional().describe('Новое название задачи'),
  description: z.string().optional().describe('Новое описание задачи'),
  dueDate: z.string().optional().describe('Новый срок выполнения'),
  priorityId: z.string().optional().describe('Новый ID приоритета'),
});

export const updateTaskStatusSchema = z.object({
  taskId: z.string().describe('ID задачи'),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).describe('Новый статус задачи'),
});

export const deleteTaskSchema = z.object({
  taskId: z.string().describe('ID задачи для удаления'),
});

export const getTasksByContactSchema = z.object({
  contactId: z.string().describe('ID контакта'),
});

export const getTasksByProjectSchema = z.object({
  projectId: z.string().describe('ID проекта'),
});

// ВЗАИМОДЕЙСТВИЯ
export const searchInteractionsSchema = z.object({
  contactId: z.string().optional().describe('Фильтр по ID контакта'),
  channelId: z.string().optional().describe('Фильтр по ID канала'),
  direction: z.enum(['inbound', 'outbound']).optional().describe('Фильтр по направлению'),
  limit: z.number().min(1).max(50).default(20).describe('Максимальное количество результатов'),
});

export const getInteractionDetailsSchema = z.object({
  interactionId: z.string().describe('ID взаимодействия'),
});

export const getInteractionsByContactSchema = z.object({
  contactId: z.string().describe('ID контакта'),
  limit: z.number().min(1).max(100).default(50).describe('Максимальное количество результатов'),
});

export const getInteractionStatsSchema = z.object({
  contactId: z.string().describe('ID контакта'),
});

export const createInteractionSchema = z.object({
  contactId: z.string().describe('ID контакта (обязательно)'),
  channelId: z.string().describe('ID канала взаимодействия (обязательно)'),
  subject: z.string().optional().describe('Тема или заголовок взаимодействия'),
  content: z.string().describe('Содержание взаимодействия (обязательно)'),
  direction: z.enum(['inbound', 'outbound']).describe('Направление взаимодействия (обязательно)'),
});

export const updateInteractionSchema = z.object({
  interactionId: z.string().describe('ID взаимодействия (обязательно)'),
  subject: z.string().optional().describe('Новая тема взаимодействия'),
  content: z.string().optional().describe('Новое содержание взаимодействия'),
  status: z.enum(['pending', 'completed', 'cancelled']).optional().describe('Новый статус взаимодействия'),
});

export const deleteInteractionSchema = z.object({
  interactionId: z.string().describe('ID взаимодействия для удаления'),
});

// ВОРОНКИ
export const getPipelinesSchema = z.object({});

export const getPipelineStagesSchema = z.object({
  pipelineId: z.string().describe('ID воронки (обязательно)'),
});

export const getPipelineAnalyticsSchema = z.object({
  pipelineId: z.string().optional().describe('ID воронки (опционально, используется воронка по умолчанию)'),
});

export const getDefaultPipelineSchema = z.object({});

export const getPipelineByCodeSchema = z.object({
  code: z.string().describe('Код воронки (например: sales, leads)'),
});

export const getInitialStageSchema = z.object({
  pipelineId: z.string().describe('ID воронки'),
});

// УТИЛИТЫ
export const getCurrentDatetimeSchema = z.object({});

// СПРАВОЧНИКИ
export const searchDictionariesSchema = z.object({
  codes: z.array(z.string()).optional().describe('Коды справочников для получения (например: ["task_priorities", "contact_types"]). Если не указано — вернёт все справочники'),
  includeItems: z.boolean().default(true).describe('Включить элементы справочников в ответ (по умолчанию: true)'),
});

// КАНАЛЫ
export const getChannelsSchema = z.object({});

// ПОЛЬЗОВАТЕЛИ
export const searchUsersSchema = z.object({
  query: z.string().optional().describe('Поисковый запрос (имя или email)'),
  role: z.string().optional().describe('Фильтр по роли (admin, manager, user)'),
  isActive: z.boolean().optional().describe('Фильтр по активности'),
  limit: z.number().min(1).max(50).default(10).describe('Максимальное количество результатов'),
});

export const getUserDetailsSchema = z.object({
  userId: z.string().describe('ID пользователя'),
});

export const updateUserSchema = z.object({
  userId: z.string().describe('ID пользователя (обязательно)'),
  name: z.string().optional().describe('Новое имя пользователя'),
  email: z.string().optional().describe('Новый email пользователя'),
  image: z.string().optional().describe('URL аватара пользователя'),
});

// ПРОЕКТЫ
export const searchProjectsSchema = z.object({
  query: z.string().optional().describe('Поисковый запрос (название или описание)'),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional().describe('Фильтр по статусу проекта'),
  ownerId: z.string().optional().describe('Фильтр по владельцу проекта'),
  limit: z.number().min(1).max(50).default(10).describe('Максимальное количество результатов'),
});

export const getProjectDetailsSchema = z.object({
  projectId: z.string().describe('ID проекта'),
});

export const createProjectSchema = z.object({
  name: z.string().describe('Название проекта (обязательно)'),
  description: z.string().optional().describe('Описание проекта'),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional().describe('Статус проекта (по умолчанию: active)'),
  deadline: z.string().optional().describe('Дедлайн проекта в формате ISO'),
  ownerId: z.string().optional().describe('ID владельца проекта'),
});

export const updateProjectSchema = z.object({
  projectId: z.string().describe('ID проекта (обязательно)'),
  name: z.string().optional().describe('Новое название проекта'),
  description: z.string().optional().describe('Новое описание проекта'),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional().describe('Новый статус проекта'),
  deadline: z.string().optional().describe('Новый дедлайн проекта'),
});

export const deleteProjectSchema = z.object({
  projectId: z.string().describe('ID проекта для удаления'),
});

// ==================== TYPE EXPORTS ====================

// Контакты
export type SearchContactsParams = z.infer<typeof searchContactsSchema>;
export type GetContactDetailsParams = z.infer<typeof getContactDetailsSchema>;
export type CreateContactParams = z.infer<typeof createContactSchema>;
export type UpdateContactParams = z.infer<typeof updateContactSchema>;
export type DeleteContactParams = z.infer<typeof deleteContactSchema>;

// Сделки
export type SearchOpportunitiesParams = z.infer<typeof searchOpportunitiesSchema>;
export type GetOpportunityDetailsParams = z.infer<typeof getOpportunityDetailsSchema>;
export type GetOpportunitiesStatsParams = z.infer<typeof getOpportunitiesStatsSchema>;
export type CreateOpportunityParams = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityParams = z.infer<typeof updateOpportunitySchema>;
export type UpdateOpportunityStageParams = z.infer<typeof updateOpportunityStageSchema>;
export type DeleteOpportunityParams = z.infer<typeof deleteOpportunitySchema>;
export type ArchiveOpportunityParams = z.infer<typeof archiveOpportunitySchema>;

// Задачи
export type GetTasksOverviewParams = z.infer<typeof getTasksOverviewSchema>;
export type GetTaskDetailsParams = z.infer<typeof getTaskDetailsSchema>;
export type CreateTaskParams = z.infer<typeof createTaskSchema>;
export type UpdateTaskParams = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusParams = z.infer<typeof updateTaskStatusSchema>;
export type DeleteTaskParams = z.infer<typeof deleteTaskSchema>;
export type GetTasksByContactParams = z.infer<typeof getTasksByContactSchema>;
export type GetTasksByProjectParams = z.infer<typeof getTasksByProjectSchema>;

// Взаимодействия
export type SearchInteractionsParams = z.infer<typeof searchInteractionsSchema>;
export type GetInteractionDetailsParams = z.infer<typeof getInteractionDetailsSchema>;
export type GetInteractionsByContactParams = z.infer<typeof getInteractionsByContactSchema>;
export type GetInteractionStatsParams = z.infer<typeof getInteractionStatsSchema>;
export type CreateInteractionParams = z.infer<typeof createInteractionSchema>;
export type UpdateInteractionParams = z.infer<typeof updateInteractionSchema>;
export type DeleteInteractionParams = z.infer<typeof deleteInteractionSchema>;

// Воронки
export type GetPipelinesParams = z.infer<typeof getPipelinesSchema>;
export type GetPipelineStagesParams = z.infer<typeof getPipelineStagesSchema>;
export type GetPipelineAnalyticsParams = z.infer<typeof getPipelineAnalyticsSchema>;
export type GetDefaultPipelineParams = z.infer<typeof getDefaultPipelineSchema>;
export type GetPipelineByCodeParams = z.infer<typeof getPipelineByCodeSchema>;
export type GetInitialStageParams = z.infer<typeof getInitialStageSchema>;

// Справочники
export type SearchDictionariesParams = z.infer<typeof searchDictionariesSchema>;

// Каналы
export type GetChannelsParams = z.infer<typeof getChannelsSchema>;

// Пользователи
export type SearchUsersParams = z.infer<typeof searchUsersSchema>;
export type GetUserDetailsParams = z.infer<typeof getUserDetailsSchema>;
export type UpdateUserParams = z.infer<typeof updateUserSchema>;

// Проекты
export type SearchProjectsParams = z.infer<typeof searchProjectsSchema>;
export type GetProjectDetailsParams = z.infer<typeof getProjectDetailsSchema>;
export type CreateProjectParams = z.infer<typeof createProjectSchema>;
export type UpdateProjectParams = z.infer<typeof updateProjectSchema>;
export type DeleteProjectParams = z.infer<typeof deleteProjectSchema>;

// Mapping of tool names to their schemas for dynamic registration
export const TOOL_SCHEMAS: Record<string, z.ZodObject<z.ZodRawShape>> = {
  // Контакты
  search_contacts: searchContactsSchema,
  get_contact_details: getContactDetailsSchema,
  create_contact: createContactSchema,
  update_contact: updateContactSchema,
  delete_contact: deleteContactSchema,

  // Сделки
  search_opportunities: searchOpportunitiesSchema,
  get_opportunity_details: getOpportunityDetailsSchema,
  get_opportunities_stats: getOpportunitiesStatsSchema,
  create_opportunity: createOpportunitySchema,
  update_opportunity: updateOpportunitySchema,
  update_opportunity_stage: updateOpportunityStageSchema,
  delete_opportunity: deleteOpportunitySchema,
  archive_opportunity: archiveOpportunitySchema,

  // Задачи
  get_tasks_overview: getTasksOverviewSchema,
  get_task_details: getTaskDetailsSchema,
  create_task: createTaskSchema,
  update_task: updateTaskSchema,
  update_task_status: updateTaskStatusSchema,
  delete_task: deleteTaskSchema,
  get_tasks_by_contact: getTasksByContactSchema,
  get_tasks_by_project: getTasksByProjectSchema,

  // Взаимодействия
  search_interactions: searchInteractionsSchema,
  get_interaction_details: getInteractionDetailsSchema,
  get_interactions_by_contact: getInteractionsByContactSchema,
  get_interaction_stats: getInteractionStatsSchema,
  create_interaction: createInteractionSchema,
  update_interaction: updateInteractionSchema,
  delete_interaction: deleteInteractionSchema,

  // Воронки
  get_pipelines: getPipelinesSchema,
  get_pipeline_stages: getPipelineStagesSchema,
  get_pipeline_analytics: getPipelineAnalyticsSchema,
  get_default_pipeline: getDefaultPipelineSchema,
  get_pipeline_by_code: getPipelineByCodeSchema,
  get_initial_stage: getInitialStageSchema,

  // Утилиты
  get_current_datetime: getCurrentDatetimeSchema,

  // Справочники
  search_dictionaries: searchDictionariesSchema,

  // Каналы
  get_channels: getChannelsSchema,

  // Пользователи
  search_users: searchUsersSchema,
  get_user_details: getUserDetailsSchema,
  update_user: updateUserSchema,

  // Проекты
  search_projects: searchProjectsSchema,
  get_project_details: getProjectDetailsSchema,
  create_project: createProjectSchema,
  update_project: updateProjectSchema,
  delete_project: deleteProjectSchema,
};
