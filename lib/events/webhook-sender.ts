import { IWebhook } from '@/modules/webhook/model';
import { createWebhookLog } from '@/modules/webhook/controller';
import { WebhookPayload } from '@/modules/webhook/types';

const WEBHOOK_TIMEOUT = 30000; // 30 секунд
const MAX_RESPONSE_BODY_LENGTH = 2048;

/**
 * Отправляет HTTP запрос на webhook
 * Fire-and-forget: не выбрасывает ошибки, логирует результат
 */
export async function sendWebhook(
  webhook: IWebhook,
  event: string,
  data: unknown
): Promise<void> {
  const startTime = Date.now();
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Формируем заголовки
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'CRM-Webhook/1.0',
    'X-Webhook-Event': event,
  };

  // Добавляем кастомные заголовки
  for (const header of webhook.headers) {
    headers[header.key] = header.value;
  }

  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  let error: string | null = null;
  let success = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);

    const requestInit: RequestInit = {
      method: webhook.method,
      headers,
      signal: controller.signal,
    };

    // Добавляем тело только для методов, которые его поддерживают
    if (['POST', 'PUT', 'PATCH'].includes(webhook.method)) {
      requestInit.body = JSON.stringify(payload);
    }

    const response = await fetch(webhook.url, requestInit);
    clearTimeout(timeoutId);

    responseStatus = response.status;

    // Читаем тело ответа с ограничением
    try {
      const text = await response.text();
      responseBody = text.substring(0, MAX_RESPONSE_BODY_LENGTH);
      if (text.length > MAX_RESPONSE_BODY_LENGTH) {
        responseBody += '... (truncated)';
      }
    } catch {
      responseBody = null;
    }

    // Успешными считаем 2xx статусы
    success = response.ok;

    if (!success) {
      error = `HTTP ${responseStatus}: ${response.statusText}`;
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        error = `Timeout after ${WEBHOOK_TIMEOUT}ms`;
      } else {
        error = err.message;
      }
    } else {
      error = 'Unknown error';
    }
    success = false;
  }

  const duration = Date.now() - startTime;

  // Логируем результат асинхронно (fire-and-forget)
  createWebhookLog({
    webhookId: webhook._id.toString(),
    webhookName: webhook.name,
    event,
    url: webhook.url,
    method: webhook.method,
    requestHeaders: headers,
    requestBody: ['POST', 'PUT', 'PATCH'].includes(webhook.method) ? payload : null,
    responseStatus,
    responseBody,
    error,
    duration,
    success,
  }).catch((logError) => {
    console.error('[Webhook] Failed to create log:', logError);
  });
}

/**
 * Отправляет webhook для тестирования
 * Возвращает результат выполнения
 */
export async function testWebhook(
  webhook: IWebhook
): Promise<{
  success: boolean;
  responseStatus: number | null;
  responseBody: string | null;
  error: string | null;
  duration: number;
}> {
  const startTime = Date.now();
  const testPayload: WebhookPayload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test webhook from CRM',
      webhookId: webhook._id.toString(),
      webhookName: webhook.name,
    },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'CRM-Webhook/1.0',
    'X-Webhook-Event': 'test',
  };

  for (const header of webhook.headers) {
    headers[header.key] = header.value;
  }

  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  let error: string | null = null;
  let success = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);

    const requestInit: RequestInit = {
      method: webhook.method,
      headers,
      signal: controller.signal,
    };

    if (['POST', 'PUT', 'PATCH'].includes(webhook.method)) {
      requestInit.body = JSON.stringify(testPayload);
    }

    const response = await fetch(webhook.url, requestInit);
    clearTimeout(timeoutId);

    responseStatus = response.status;

    try {
      const text = await response.text();
      responseBody = text.substring(0, MAX_RESPONSE_BODY_LENGTH);
      if (text.length > MAX_RESPONSE_BODY_LENGTH) {
        responseBody += '... (truncated)';
      }
    } catch {
      responseBody = null;
    }

    success = response.ok;

    if (!success) {
      error = `HTTP ${responseStatus}: ${response.statusText}`;
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        error = `Timeout after ${WEBHOOK_TIMEOUT}ms`;
      } else {
        error = err.message;
      }
    } else {
      error = 'Unknown error';
    }
    success = false;
  }

  const duration = Date.now() - startTime;

  // Логируем тестовый вызов
  createWebhookLog({
    webhookId: webhook._id.toString(),
    webhookName: webhook.name,
    event: 'test',
    url: webhook.url,
    method: webhook.method,
    requestHeaders: headers,
    requestBody: ['POST', 'PUT', 'PATCH'].includes(webhook.method) ? testPayload : null,
    responseStatus,
    responseBody,
    error,
    duration,
    success,
  }).catch((logError) => {
    console.error('[Webhook] Failed to create log:', logError);
  });

  return {
    success,
    responseStatus,
    responseBody,
    error,
    duration,
  };
}
