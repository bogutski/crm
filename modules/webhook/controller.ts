import Webhook, { IWebhook } from './model';
import WebhookLog, { IWebhookLog } from './log-model';
import {
  CreateWebhookDTO,
  UpdateWebhookDTO,
  WebhookResponse,
  WebhooksListResponse,
  WebhookFilters,
  WebhookLogResponse,
  WebhookLogsListResponse,
  WebhookLogFilters,
  WEBHOOK_EVENTS_GROUPED,
  WEBHOOK_ENTITY_LABELS,
  WebhookEventEntity,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';

function toWebhookResponse(webhook: IWebhook): WebhookResponse {
  return {
    id: webhook._id.toString(),
    name: webhook.name,
    url: webhook.url,
    method: webhook.method,
    headers: webhook.headers,
    events: webhook.events,
    isActive: webhook.isActive,
    createdAt: webhook.createdAt,
    updatedAt: webhook.updatedAt,
  };
}

function toWebhookLogResponse(log: IWebhookLog): WebhookLogResponse {
  return {
    id: log._id.toString(),
    webhookId: log.webhookId.toString(),
    webhookName: log.webhookName,
    event: log.event,
    url: log.url,
    method: log.method,
    requestHeaders: log.requestHeaders,
    requestBody: log.requestBody,
    responseStatus: log.responseStatus,
    responseBody: log.responseBody,
    error: log.error,
    duration: log.duration,
    success: log.success,
    createdAt: log.createdAt,
  };
}

// === Webhook CRUD ===

export async function getWebhooks(filters: WebhookFilters): Promise<WebhooksListResponse> {
  await dbConnect();

  const { search, isActive, page = 1, limit = 20 } = filters;
  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { url: { $regex: search, $options: 'i' } },
    ];
  }

  if (typeof isActive === 'boolean') {
    query.isActive = isActive;
  }

  const skip = (page - 1) * limit;

  const [webhooks, total] = await Promise.all([
    Webhook.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Webhook.countDocuments(query),
  ]);

  return {
    webhooks: webhooks.map(toWebhookResponse),
    total,
    page,
    limit,
  };
}

export async function getWebhookById(id: string): Promise<WebhookResponse | null> {
  await dbConnect();

  const webhook = await Webhook.findById(id);
  if (!webhook) return null;

  return toWebhookResponse(webhook);
}

export async function createWebhook(data: CreateWebhookDTO): Promise<WebhookResponse> {
  await dbConnect();

  const webhook = await Webhook.create({
    name: data.name,
    url: data.url,
    method: data.method || 'POST',
    headers: data.headers || [],
    events: data.events,
    isActive: data.isActive ?? true,
  });

  return toWebhookResponse(webhook);
}

export async function updateWebhook(id: string, data: UpdateWebhookDTO): Promise<WebhookResponse | null> {
  await dbConnect();

  const webhook = await Webhook.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  );

  if (!webhook) return null;

  return toWebhookResponse(webhook);
}

export async function deleteWebhook(id: string): Promise<boolean> {
  await dbConnect();

  const result = await Webhook.findByIdAndDelete(id);
  return !!result;
}

// === Webhook Logs ===

export async function getWebhookLogs(
  webhookId: string,
  filters: WebhookLogFilters
): Promise<WebhookLogsListResponse> {
  await dbConnect();

  const { event, success, page = 1, limit = 20 } = filters;
  const query: Record<string, unknown> = { webhookId };

  if (event) {
    query.event = event;
  }

  if (typeof success === 'boolean') {
    query.success = success;
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    WebhookLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    WebhookLog.countDocuments(query),
  ]);

  return {
    logs: logs.map(toWebhookLogResponse),
    total,
    page,
    limit,
  };
}

// === Получение активных webhooks для события ===

export async function getActiveWebhooksForEvent(event: string): Promise<IWebhook[]> {
  await dbConnect();

  return Webhook.find({
    events: event,
    isActive: true,
  });
}

// === Создание лога ===

export async function createWebhookLog(data: {
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
}): Promise<void> {
  await dbConnect();

  await WebhookLog.create(data);
}

// === Получение доступных событий ===

export function getAvailableEvents() {
  const events = Object.entries(WEBHOOK_EVENTS_GROUPED).map(([entity, items]) => ({
    entity,
    entityLabel: WEBHOOK_ENTITY_LABELS[entity as WebhookEventEntity],
    items,
  }));

  return { events };
}

// === Статистика webhook ===

export async function getWebhookStats(webhookId: string): Promise<{
  total: number;
  success: number;
  failed: number;
  lastTriggeredAt: Date | null;
}> {
  await dbConnect();

  const [total, success, lastLog] = await Promise.all([
    WebhookLog.countDocuments({ webhookId }),
    WebhookLog.countDocuments({ webhookId, success: true }),
    WebhookLog.findOne({ webhookId }).sort({ createdAt: -1 }),
  ]);

  return {
    total,
    success,
    failed: total - success,
    lastTriggeredAt: lastLog?.createdAt || null,
  };
}
