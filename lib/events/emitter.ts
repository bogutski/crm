import { getActiveWebhooksForEvent } from '@/modules/webhook/controller';
import { sendWebhook } from './webhook-sender';
import { WebhookEventEntity, WEBHOOK_ENTITIES } from '@/modules/webhook/types';

type WebhookAction = 'created' | 'updated' | 'deleted' | 'stage_changed';

/**
 * Отправляет событие всем подписанным webhooks
 * Асинхронно, fire-and-forget
 */
export async function emitWebhookEvent(
  entity: WebhookEventEntity,
  action: WebhookAction,
  data: unknown
): Promise<void> {
  const event = `${entity}.${action}`;

  // Валидация сущности
  if (!WEBHOOK_ENTITIES.includes(entity)) {
    console.warn(`[WebhookEmitter] Unknown entity: ${entity}`);
    return;
  }

  try {
    // Получаем все активные webhooks подписанные на это событие
    const webhooks = await getActiveWebhooksForEvent(event);

    if (webhooks.length === 0) {
      return;
    }

    // Отправляем запросы параллельно (fire-and-forget)
    // Не ждём результатов - это асинхронная отправка
    for (const webhook of webhooks) {
      // Запускаем отправку без await, чтобы не блокировать
      sendWebhook(webhook, event, data).catch((err) => {
        console.error(`[WebhookEmitter] Error sending webhook ${webhook.name}:`, err);
      });
    }
  } catch (err) {
    console.error(`[WebhookEmitter] Error processing event ${event}:`, err);
  }
}

/**
 * Обёртка для безопасного вызова emitWebhookEvent
 * Не выбрасывает ошибки, только логирует
 */
export function safeEmitWebhookEvent(
  entity: WebhookEventEntity,
  action: WebhookAction,
  data: unknown
): void {
  // Fire-and-forget: запускаем без await
  emitWebhookEvent(entity, action, data).catch((err) => {
    console.error(`[WebhookEmitter] Safe emit error for ${entity}.${action}:`, err);
  });
}
