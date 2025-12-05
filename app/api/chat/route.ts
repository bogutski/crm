import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { getAIModel } from '@/lib/ai/service';
import { apiAuth } from '@/lib/api-auth';
import { getSystemSettingsInternal } from '@/modules/system-settings/controller';
import {
  createDialogue,
  getActiveDialogue,
  addMessage,
  updateDialogueStatus,
  updateDialogueTitle,
} from '@/modules/ai-dialogue';

export const maxDuration = 30; // Максимальная длительность запроса (секунды)

// POST /api/ai/chat - AI чат endpoint
export async function POST(request: NextRequest) {
  try {
    console.log('[AI Chat] Received request');

    // Проверка авторизации
    const authResult = await apiAuth(request);
    if (!authResult) {
      console.log('[AI Chat] Authorization failed');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[AI Chat] Authorization successful:', authResult.type);

    const userId = authResult.userId;
    if (!userId) {
      console.log('[AI Chat] User ID not found');
      return new Response(JSON.stringify({ error: 'User ID not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Получаем системные настройки для определения провайдера и модели
    const settings = await getSystemSettingsInternal();
    const provider = settings.ai?.activeProvider;
    const modelName = provider ? settings.ai?.providers[provider]?.model : undefined;

    if (!provider || !modelName) {
      console.error('[AI Chat] AI provider not configured');
      return new Response(
        JSON.stringify({
          error: 'AI Configuration Error',
          details: 'AI provider not configured in system settings',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Получаем активную AI модель из настроек
    let model;
    try {
      console.log('[AI Chat] Getting AI model...');
      model = await getAIModel();
      console.log('[AI Chat] AI model loaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI provider not configured';
      console.error('[AI Chat] Failed to get AI model:', errorMessage);
      return new Response(
        JSON.stringify({
          error: 'AI Configuration Error',
          details: errorMessage,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Получаем сообщения из тела запроса
    const body = await request.json();
    console.log('[AI Chat] Request body:', JSON.stringify(body, null, 2));

    const { messages, dialogueId } = body;

    if (!messages || !Array.isArray(messages)) {
      console.log('[AI Chat] Invalid messages format. messages:', messages);
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[AI Chat] Received messages:', messages.length);
    console.log('[AI Chat] Messages data:', JSON.stringify(messages, null, 2));

    // Получаем или создаем диалог
    let dialogue;
    if (dialogueId) {
      dialogue = await getActiveDialogue(userId);
      if (!dialogue || dialogue._id.toString() !== dialogueId) {
        console.log('[AI Chat] Creating new dialogue (invalid dialogueId)');
        dialogue = await createDialogue({
          userId,
          provider,
          model: modelName,
          title: 'Новый диалог',
        });
      }
    } else {
      // Ищем активный диалог или создаем новый
      dialogue = await getActiveDialogue(userId);
      if (!dialogue) {
        console.log('[AI Chat] Creating new dialogue');
        dialogue = await createDialogue({
          userId,
          provider,
          model: modelName,
          title: 'Новый диалог',
        });
      }
    }

    console.log('[AI Chat] Using dialogue:', dialogue._id.toString());

    // Сохраняем сообщение пользователя
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      const userMessageContent = lastMessage.content ||
        (lastMessage.parts?.[0]?.type === 'text' ? lastMessage.parts[0].text : '');

      await addMessage(dialogue._id.toString(), {
        role: 'user',
        content: userMessageContent,
      });

      console.log('[AI Chat] User message saved');

      // Обновляем заголовок диалога на основе первого сообщения
      if (dialogue.messages.length === 0) {
        const title = userMessageContent.substring(0, 50) + (userMessageContent.length > 50 ? '...' : '');
        await updateDialogueTitle(dialogue._id.toString(), title);
      }
    }

    // Преобразуем сообщения в CoreMessage формат (убираем id)
    const coreMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log('[AI Chat] Messages formatted for AI');
    console.log('[AI Chat] Starting stream...');

    // Создаем streaming ответ с сохранением результата
    let fullResponse = '';

    const result = streamText({
      model,
      messages: coreMessages,
      system: `Ты - AI ассистент для CRM системы. Ты помогаешь пользователям с аналитикой и управлением данными.

Ты можешь:
- Отвечать на вопросы о системе
- Помогать с аналитикой данных
- Давать рекомендации по работе с CRM

Отвечай на русском языке, если пользователь пишет на русском.
Будь кратким и полезным.`,
      temperature: 0.7,
      onFinish: async (event) => {
        try {
          console.log('[AI Chat] Stream finished, saving response');
          console.log('[AI Chat] Response text:', event.text);
          console.log('[AI Chat] Tokens used:', event.usage);

          // Сохраняем ответ ассистента
          await addMessage(dialogue!._id.toString(), {
            role: 'assistant',
            content: event.text,
            metadata: {
              model: modelName,
              tokens: {
                prompt: event.usage?.inputTokens || 0,
                completion: event.usage?.outputTokens || 0,
                total: (event.usage?.inputTokens || 0) + (event.usage?.outputTokens || 0),
              },
            },
          });

          console.log('[AI Chat] Assistant response saved successfully');
        } catch (error) {
          console.error('[AI Chat] Error saving response:', error);
        }
      },
    });

    console.log('[AI Chat] Stream created successfully');

    // Добавляем dialogueId в headers ответа
    const response = result.toTextStreamResponse();
    response.headers.set('X-Dialogue-ID', dialogue._id.toString());

    return response;
  } catch (error) {
    console.error('[AI Chat] Error in AI chat endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
