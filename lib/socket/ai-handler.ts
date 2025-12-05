import { streamText, stepCountIs } from 'ai';
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

  console.log('[AI Handler] handleAIMessage called:', { userId, dialogueId, message });

  try {
    // Получаем системные настройки
    console.log('[AI Handler] Getting system settings...');
    const settings = await getSystemSettingsInternal();
    console.log('[AI Handler] Settings loaded, provider:', settings.ai?.activeProvider);
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
    console.log('[AI Handler] Getting AI model...');
    const model = await getAIModel();
    console.log('[AI Handler] Model loaded');

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
    console.log('[AI Handler] Getting tools, enabled:', enabledTools);
    const tools = getAITools({ userId, enabledTools });
    console.log('[AI Handler] Tools loaded, count:', Object.keys(tools).length);

    // Стримим ответ
    console.log('[AI Handler] Starting streamText...');
    const result = streamText({
      model,
      messages: allMessages,
      tools,
      system: `Ты - AI ассистент для CRM системы. Ты помогаешь пользователям с аналитикой и управлением данными.

У тебя есть доступ к инструментам для работы с CRM:

📇 КОНТАКТЫ:
- search_contacts: Поиск контактов
- get_contact_details: Подробная информация о контакте
- create_contact: Создание нового контакта
- update_contact: Обновление данных контакта
- delete_contact: Удаление контакта

💼 СДЕЛКИ:
- search_opportunities: Поиск сделок
- get_opportunity_details: Подробная информация о сделке
- get_opportunities_stats: Статистика по сделкам
- create_opportunity: Создание новой сделки
- update_opportunity: Обновление данных сделки
- update_opportunity_stage: Перемещение сделки по воронке
- archive_opportunity: Архивация сделки
- delete_opportunity: Удаление сделки

✅ ЗАДАЧИ:
- get_tasks_overview: Обзор задач (статистика и список)
- get_task_details: Подробная информация о задаче
- create_task: Создание новой задачи
- update_task: Обновление данных задачи
- update_task_status: Изменение статуса задачи
- delete_task: Удаление задачи
- get_tasks_by_contact: Задачи привязанные к контакту
- get_tasks_by_project: Задачи привязанные к проекту

📞 ВЗАИМОДЕЙСТВИЯ:
- search_interactions: Поиск взаимодействий
- get_interaction_details: Подробная информация о взаимодействии
- get_interactions_by_contact: Все взаимодействия с контактом
- get_interaction_stats: Статистика взаимодействий
- create_interaction: Запись нового взаимодействия
- update_interaction: Обновление взаимодействия
- delete_interaction: Удаление взаимодействия

📊 ВОРОНКИ:
- get_pipelines: Список всех воронок
- get_pipeline_stages: Стадии воронки
- get_pipeline_analytics: Аналитика воронки
- get_default_pipeline: Воронка по умолчанию
- get_initial_stage: Начальная стадия воронки

📁 ПРОЕКТЫ:
- search_projects: Поиск проектов
- get_project_details: Подробная информация о проекте
- create_project: Создание проекта
- update_project: Обновление проекта
- delete_project: Удаление проекта

👥 ПОЛЬЗОВАТЕЛИ:
- search_users: Поиск пользователей
- get_user_details: Информация о пользователе

📚 СПРАВОЧНИКИ:
- get_dictionaries: Список справочников
- get_dictionary_items: Элементы справочника
- get_channels: Список каналов коммуникации

ВАЖНО:
- Используй инструменты для получения актуальных данных из CRM
- При выполнении действий (создание, изменение, удаление) сообщай о результате
- Форматируй ответы наглядно, используя списки и структуру
- Отвечай на русском языке, если пользователь пишет на русском
- Будь кратким и полезным`,
      temperature: 0.7,
      stopWhen: stepCountIs(5), // Allow AI to make multiple tool calls and continue generating
      abortSignal: abortController.signal,
      onChunk: ({ chunk }) => {
        console.log('[AI Handler] onChunk:', chunk.type);
        if (chunk.type === 'text-delta') {
          const text = (chunk as any).text || (chunk as any).textDelta || '';
          fullResponse += text;
          emitToUser(userId, 'ai:stream:chunk', {
            dialogueId: currentDialogueId,
            chunk: text,
          });
        } else if (chunk.type === 'tool-call') {
          console.log('[AI Handler] Tool call:', (chunk as any).toolName);
        } else if (chunk.type === 'tool-result') {
          const resultStr = JSON.stringify((chunk as any).result || (chunk as any).output || chunk);
          console.log('[AI Handler] Tool result received:', resultStr.substring(0, 200));
        }
      },
      onStepFinish: (step) => {
        console.log('[AI Handler] Step finished:', {
          stepType: step.stepType,
          text: step.text?.substring(0, 100),
          toolCalls: step.toolCalls?.length,
          toolResults: step.toolResults?.length,
          finishReason: step.finishReason,
        });
      },
      onFinish: async (event) => {
        console.log('[AI Handler] onFinish called, text length:', event.text?.length, 'steps:', (event as any).steps?.length, 'finishReason:', (event as any).finishReason);
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
    console.log('[AI Handler] Waiting for stream to complete...');
    try {
      // Consume the stream to ensure it completes
      for await (const chunk of result.textStream) {
        // Stream chunks are handled in onChunk
        if (chunk) {
          console.log('[AI Handler] textStream chunk:', chunk.substring(0, 50));
        }
      }
      console.log('[AI Handler] Stream completed successfully');
    } catch (streamError) {
      console.error('[AI Handler] Stream error:', streamError);
      throw streamError;
    }

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
