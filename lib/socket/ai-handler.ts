import { streamText } from 'ai';
import { getAIModel } from '@/lib/ai/service';
import { getSystemSettingsInternal } from '@/modules/system-settings/controller';
import {
  createDialogue,
  getActiveDialogue,
  addMessage,
  updateDialogueTitle,
} from '@/modules/ai-dialogue';
import { emitToUser } from './handlers';
import { getAITools } from '@/lib/ai/tools';

// Активные стримы для возможности отмены
const activeStreams = new Map<string, AbortController>();

interface AIMessageParams {
  userId: string;
  dialogueId?: string;
  message: string;
}

export async function handleAIMessage(params: AIMessageParams) {
  const { userId, dialogueId, message } = params;

  try {
    // Получаем системные настройки
    const settings = await getSystemSettingsInternal();
    const provider = settings.ai?.activeProvider;
    const modelName = provider ? settings.ai?.providers[provider]?.model : undefined;

    if (!provider || !modelName) {
      emitToUser(userId, 'ai:stream:error', {
        dialogueId: dialogueId || '',
        error: 'AI провайдер не настроен',
      });
      return;
    }

    // Получаем модель
    const model = await getAIModel();

    // Получаем или создаём диалог
    let dialogue;
    if (dialogueId) {
      dialogue = await getActiveDialogue(userId);
      if (!dialogue || dialogue._id.toString() !== dialogueId) {
        dialogue = await createDialogue({
          userId,
          provider,
          model: modelName,
          title: 'Новый диалог',
        });
      }
    } else {
      dialogue = await createDialogue({
        userId,
        provider,
        model: modelName,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      });
    }

    const currentDialogueId = dialogue._id.toString();

    // Сохраняем сообщение пользователя
    await addMessage(currentDialogueId, {
      role: 'user',
      content: message,
    });

    // Обновляем заголовок если это первое сообщение
    if (dialogue.messages.length === 0) {
      const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      await updateDialogueTitle(currentDialogueId, title);
    }

    // Получаем историю сообщений
    const historyMessages = dialogue.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Добавляем текущее сообщение
    const allMessages = [
      ...historyMessages,
      { role: 'user' as const, content: message },
    ];

    // Создаём AbortController для возможности отмены
    const abortController = new AbortController();
    activeStreams.set(currentDialogueId, abortController);

    // Уведомляем о начале стрима
    emitToUser(userId, 'ai:stream:start', { dialogueId: currentDialogueId });

    let fullResponse = '';

    // Get enabled tools from settings
    const enabledTools = settings.ai?.tools?.enabled;
    const tools = getAITools({ userId, enabledTools });

    // Стримим ответ
    const result = streamText({
      model,
      messages: allMessages,
      tools,
      system: `Ты - AI ассистент для CRM системы. Ты помогаешь пользователям с аналитикой и управлением данными.

У тебя есть доступ к следующим инструментам для работы с CRM:

АНАЛИТИКА (только чтение):
- search_contacts: Поиск контактов по имени, email, телефону или компании
- get_opportunities_stats: Статистика по сделкам (суммы, количество по стадиям)
- get_tasks_overview: Обзор задач (открытые, просроченные, по статусам)
- get_pipeline_analytics: Аналитика воронки продаж (конверсия, средний чек)
- search_opportunities: Поиск сделок по различным критериям
- get_contact_details: Подробная информация о контакте с историей

ДЕЙСТВИЯ (изменение данных):
- create_task: Создание новой задачи
- update_opportunity_stage: Перемещение сделки на другую стадию
- create_interaction: Запись взаимодействия с контактом (звонок, письмо)
- update_task_status: Изменение статуса задачи

ВАЖНО:
- Используй инструменты для получения актуальных данных из CRM
- При выполнении действий (создание, изменение) сообщай о результате
- Форматируй ответы наглядно, используя списки и структуру
- Отвечай на русском языке, если пользователь пишет на русском
- Будь кратким и полезным`,
      temperature: 0.7,
      abortSignal: abortController.signal,
      onChunk: ({ chunk }) => {
        if (chunk.type === 'text-delta') {
          const text = (chunk as any).text || (chunk as any).textDelta || '';
          fullResponse += text;
          emitToUser(userId, 'ai:stream:chunk', {
            dialogueId: currentDialogueId,
            chunk: text,
          });
        }
      },
      onFinish: async (event) => {
        // Удаляем из активных стримов
        activeStreams.delete(currentDialogueId);

        // Сохраняем ответ ассистента с информацией о tool calls
        const toolCalls = (event as any).toolCalls?.map((tc: any) => ({
          id: tc.toolCallId,
          name: tc.toolName,
          arguments: tc.args,
        }));

        await addMessage(currentDialogueId, {
          role: 'assistant',
          content: event.text,
          toolCalls,
          metadata: {
            model: modelName,
            tokens: {
              prompt: (event.usage as any)?.promptTokens || 0,
              completion: (event.usage as any)?.completionTokens || 0,
              total: (event.usage as any)?.totalTokens || 0,
            },
          },
        });

        // Уведомляем о завершении
        emitToUser(userId, 'ai:stream:end', {
          dialogueId: currentDialogueId,
          fullMessage: event.text,
        });
      },
    });

    // Ждём завершения стрима
    await result.text;

  } catch (error) {
    console.error('[AI Handler] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';

    emitToUser(userId, 'ai:stream:error', {
      dialogueId: dialogueId || '',
      error: errorMessage,
    });
  }
}

export function cancelAIStream(dialogueId: string): boolean {
  const controller = activeStreams.get(dialogueId);
  if (controller) {
    controller.abort();
    activeStreams.delete(dialogueId);
    return true;
  }
  return false;
}
