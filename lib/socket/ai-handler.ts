import { streamText, stepCountIs, CoreMessage, ToolContent, ToolCallPart, ToolResultPart } from 'ai';
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
import { generateSystemPrompt } from '@/lib/ai/prompts/mcp-system';
import { IDialogueMessage } from '@/modules/ai-dialogue/model';

// Активные стримы для возможности отмены
const activeStreams = new Map<string, AbortController>();

/**
 * Преобразует сообщения из БД в формат CoreMessage для AI SDK v5
 *
 * ВАЖНО: AI SDK v5 имеет строгие требования к формату:
 * 1. Assistant с tool-calls НЕ должен содержать text в том же массиве
 * 2. Tool results идут после tool-calls
 * 3. Финальный текст assistant идёт отдельным сообщением после tool results
 *
 * Порядок: assistant(tool-calls) -> tool(results) -> assistant(text)
 */
function buildMessagesWithToolCalls(messages: IDialogueMessage[]): CoreMessage[] {
  const result: CoreMessage[] = [];

  for (const msg of messages) {
    try {
      if (msg.role === 'user') {
        result.push({
          role: 'user',
          content: msg.content,
        });
      } else if (msg.role === 'assistant') {
        // Если есть tool calls
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          // 1. Сначала добавляем assistant с ТОЛЬКО tool-calls (без текста!)
          const toolCallParts: ToolCallPart[] = msg.toolCalls.map(tc => ({
            type: 'tool-call' as const,
            toolCallId: tc.id,
            toolName: tc.name,
            input: tc.arguments || {},
          }));

          result.push({
            role: 'assistant',
            content: toolCallParts,
          });

          // 2. Добавляем tool results
          // AI SDK v5 требует output в формате { type: 'json', value: ... } или { type: 'text', value: '...' }
          const toolResults: ToolContent = [];
          for (const tc of msg.toolCalls) {
            if (tc.result !== undefined) {
              toolResults.push({
                type: 'tool-result',
                toolCallId: tc.id,
                toolName: tc.name,
                output: {
                  type: 'json',
                  value: tc.result,
                },
              } as ToolResultPart);
            }
          }

          if (toolResults.length > 0) {
            result.push({
              role: 'tool',
              content: toolResults,
            });
          }

          // 3. Добавляем финальный текст как отдельное assistant сообщение
          if (msg.content && msg.content.trim()) {
            result.push({
              role: 'assistant',
              content: msg.content,
            });
          }
        } else {
          // Простое текстовое сообщение без tool calls
          result.push({
            role: 'assistant',
            content: msg.content,
          });
        }
      }
      // Пропускаем role='system' и role='tool' из БД - они восстанавливаются из toolCalls
    } catch (err) {
      console.error('[AI Handler] Error processing message:', msg.role, err);
      // Fallback - добавляем простое сообщение
      if (msg.role === 'user' || msg.role === 'assistant') {
        result.push({
          role: msg.role,
          content: msg.content || '',
        });
      }
    }
  }

  return result;
}

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

    // Получаем историю сообщений с tool calls
    const historyMessages = buildMessagesWithToolCalls(dialogue.messages);

    // Добавляем текущее сообщение
    const allMessages = [
      ...historyMessages,
      { role: 'user' as const, content: message },
    ];

    // Логируем историю для отладки
    console.log('[AI Handler] History messages with tool calls:', JSON.stringify(historyMessages.map(m => ({
      role: m.role,
      contentType: typeof m.content === 'string' ? 'string' : `array(${(m.content as unknown[]).length})`,
      hasToolCalls: typeof m.content !== 'string' && (m.content as unknown[]).some((p: any) => p.type === 'tool-call'),
      hasToolResults: typeof m.content !== 'string' && (m.content as unknown[]).some((p: any) => p.type === 'tool-result'),
    })), null, 2));

    // Создаём AbortController для возможности отмены
    const abortController = new AbortController();
    activeStreams.set(currentDialogueId, abortController);

    // Уведомляем о начале стрима
    emitToUser(userId, 'ai:stream:start', { dialogueId: currentDialogueId });

    let fullResponse = '';

    // Собираем информацию о вызовах инструментов с результатами
    const toolCallsMap = new Map<string, {
      id: string;
      name: string;
      arguments: Record<string, unknown>;
      result?: unknown;
      error?: string;
      status: 'pending' | 'running' | 'completed' | 'error';
      startedAt?: Date;
      completedAt?: Date;
    }>();

    // Get enabled tools from settings
    const enabledTools = settings.ai?.tools?.enabled;
    console.log('[AI Handler] Getting tools, enabled:', enabledTools);
    const tools = getAITools({ userId, enabledTools });
    console.log('[AI Handler] Tools loaded, count:', Object.keys(tools).length);

    // Генерируем системный промпт с учётом включённых инструментов
    const baseSystemPrompt = generateSystemPrompt(enabledTools);

    // Добавляем пользовательский промпт если он есть
    const customPrompt = settings.ai?.systemPrompt;
    const fullSystemPrompt = customPrompt
      ? `${baseSystemPrompt}\n\n--- ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ ---\n${customPrompt}`
      : baseSystemPrompt;

    // Стримим ответ
    console.log('[AI Handler] Starting streamText...');
    const result = streamText({
      model,
      messages: allMessages,
      tools,
      system: fullSystemPrompt,
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
          const toolCallChunk = chunk as any;
          // AI SDK v5 uses 'input' instead of 'args'
          const toolArgs = toolCallChunk.input || toolCallChunk.args || {};
          console.log('[AI Handler] Tool call:', toolCallChunk.toolName, 'args:', JSON.stringify(toolArgs).substring(0, 100));

          // Сохраняем в Map для записи в БД
          toolCallsMap.set(toolCallChunk.toolCallId, {
            id: toolCallChunk.toolCallId,
            name: toolCallChunk.toolName,
            arguments: toolArgs,
            status: 'running',
            startedAt: new Date(),
          });

          // Отправляем информацию о вызове инструмента на клиент
          emitToUser(userId, 'ai:tool:call', {
            dialogueId: currentDialogueId,
            toolCallId: toolCallChunk.toolCallId,
            toolName: toolCallChunk.toolName,
            args: toolArgs,
          });
        } else if (chunk.type === 'tool-result') {
          const toolResultChunk = chunk as any;
          const result = toolResultChunk.result || toolResultChunk.output || null;
          console.log('[AI Handler] Tool result received:', JSON.stringify(result).substring(0, 200));

          // Обновляем в Map с результатом
          const existingCall = toolCallsMap.get(toolResultChunk.toolCallId);
          if (existingCall) {
            existingCall.result = result;
            existingCall.status = 'completed';
            existingCall.completedAt = new Date();
          }

          // Отправляем результат инструмента на клиент
          emitToUser(userId, 'ai:tool:result', {
            dialogueId: currentDialogueId,
            toolCallId: toolResultChunk.toolCallId,
            result: result,
          });
        }
      },
      onStepFinish: (step) => {
        console.log('[AI Handler] Step finished:', {
          stepType: (step as any).stepType,
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

        // Собираем tool calls с результатами из Map
        const toolCalls = Array.from(toolCallsMap.values()).map(tc => ({
          id: tc.id,
          name: tc.name,
          arguments: tc.arguments,
          result: tc.result,
          error: tc.error,
          status: tc.status,
          startedAt: tc.startedAt,
          completedAt: tc.completedAt,
        }));

        console.log('[AI Handler] Saving message with toolCalls:', toolCalls.length);

        await addMessage(currentDialogueId, {
          role: 'assistant',
          content: event.text,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
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
