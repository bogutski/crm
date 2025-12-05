import { IWebhook, WebhookMethod, IWebhookHeader } from './model';
import { IWebhookLog } from './log-model';

export type { IWebhook, IWebhookLog, WebhookMethod, IWebhookHeader };

// Сущности, поддерживающие события
export const WEBHOOK_ENTITIES = [
  'contact',
  'opportunity',
  'task',
  'interaction',
  'pipeline',
  'project',
  'channel',
] as const;

export type WebhookEventEntity = (typeof WEBHOOK_ENTITIES)[number];

// Действия для событий
export const WEBHOOK_ACTIONS = ['created', 'updated', 'deleted'] as const;

// Специальные действия для определенных сущностей
export const WEBHOOK_SPECIAL_ACTIONS = {
  opportunity: ['stage_changed'],
} as const;

export type WebhookEventAction = (typeof WEBHOOK_ACTIONS)[number];

// Все возможные события
export const WEBHOOK_EVENTS = [
  // Contact
  'contact.created',
  'contact.updated',
  'contact.deleted',
  // Opportunity
  'opportunity.created',
  'opportunity.updated',
  'opportunity.deleted',
  'opportunity.stage_changed',
  // Task
  'task.created',
  'task.updated',
  'task.deleted',
  // Interaction
  'interaction.created',
  'interaction.updated',
  'interaction.deleted',
  // Pipeline
  'pipeline.created',
  'pipeline.updated',
  'pipeline.deleted',
  // Project
  'project.created',
  'project.updated',
  'project.deleted',
  // Channel
  'channel.created',
  'channel.updated',
  'channel.deleted',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

// Группировка событий по сущности для UI
export const WEBHOOK_EVENTS_GROUPED: Record<WebhookEventEntity, { event: WebhookEvent; label: string }[]> = {
  contact: [
    { event: 'contact.created', label: 'Контакт создан' },
    { event: 'contact.updated', label: 'Контакт обновлён' },
    { event: 'contact.deleted', label: 'Контакт удалён' },
  ],
  opportunity: [
    { event: 'opportunity.created', label: 'Сделка создана' },
    { event: 'opportunity.updated', label: 'Сделка обновлена' },
    { event: 'opportunity.deleted', label: 'Сделка удалена' },
    { event: 'opportunity.stage_changed', label: 'Этап сделки изменён' },
  ],
  task: [
    { event: 'task.created', label: 'Задача создана' },
    { event: 'task.updated', label: 'Задача обновлена' },
    { event: 'task.deleted', label: 'Задача удалена' },
  ],
  interaction: [
    { event: 'interaction.created', label: 'Взаимодействие создано' },
    { event: 'interaction.updated', label: 'Взаимодействие обновлено' },
    { event: 'interaction.deleted', label: 'Взаимодействие удалено' },
  ],
  pipeline: [
    { event: 'pipeline.created', label: 'Воронка создана' },
    { event: 'pipeline.updated', label: 'Воронка обновлена' },
    { event: 'pipeline.deleted', label: 'Воронка удалена' },
  ],
  project: [
    { event: 'project.created', label: 'Проект создан' },
    { event: 'project.updated', label: 'Проект обновлён' },
    { event: 'project.deleted', label: 'Проект удалён' },
  ],
  channel: [
    { event: 'channel.created', label: 'Канал создан' },
    { event: 'channel.updated', label: 'Канал обновлён' },
    { event: 'channel.deleted', label: 'Канал удалён' },
  ],
};

// Названия сущностей для UI
export const WEBHOOK_ENTITY_LABELS: Record<WebhookEventEntity, string> = {
  contact: 'Контакты',
  opportunity: 'Сделки',
  task: 'Задачи',
  interaction: 'Взаимодействия',
  pipeline: 'Воронки',
  project: 'Проекты',
  channel: 'Каналы',
};

// DTO для создания webhook
export interface CreateWebhookDTO {
  name: string;
  url: string;
  method?: WebhookMethod;
  headers?: IWebhookHeader[];
  events: string[];
  isActive?: boolean;
}

// DTO для обновления webhook
export interface UpdateWebhookDTO {
  name?: string;
  url?: string;
  method?: WebhookMethod;
  headers?: IWebhookHeader[];
  events?: string[];
  isActive?: boolean;
}

// Response для webhook
export interface WebhookResponse {
  id: string;
  name: string;
  url: string;
  method: WebhookMethod;
  headers: IWebhookHeader[];
  events: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Response для списка webhooks
export interface WebhooksListResponse {
  webhooks: WebhookResponse[];
  total: number;
  page: number;
  limit: number;
}

// Фильтры для списка
export interface WebhookFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// Response для лога
export interface WebhookLogResponse {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody: object | null;
  responseStatus: number | null;
  responseBody: string | null;
  error: string | null;
  duration: number;
  success: boolean;
  createdAt: Date;
}

// Response для списка логов
export interface WebhookLogsListResponse {
  logs: WebhookLogResponse[];
  total: number;
  page: number;
  limit: number;
}

// Фильтры для логов
export interface WebhookLogFilters {
  webhookId?: string;
  event?: string;
  success?: boolean;
  page?: number;
  limit?: number;
}

// Payload для события webhook
export interface WebhookPayload<T = unknown> {
  event: string;
  timestamp: string;
  data: T;
}
