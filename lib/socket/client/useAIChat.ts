'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSocket } from './SocketContext';

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: unknown;
  error?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

interface UseAIChatOptions {
  dialogueId?: string | null;
  onDialogueCreated?: (dialogueId: string) => void;
}

/**
 * Хук для работы с AI чатом через Socket.IO
 * Поддерживает стриминг ответов
 */
export function useAIChat(options: UseAIChatOptions = {}) {
  const { dialogueId, onDialogueCreated } = options;
  const { socket, isConnected, isAuthenticated } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStreamRef = useRef<string>('');
  const streamMessageIdRef = useRef<string | null>(null);
  // ID диалога для текущего стрима - нужен чтобы отслеживать события при создании нового диалога
  const activeStreamDialogueIdRef = useRef<string | null>(null);
  // Ref для dialogueId чтобы избежать проблем с замыканиями в обработчиках событий
  const dialogueIdRef = useRef<string | null>(dialogueId || null);
  // Ref для onDialogueCreated
  const onDialogueCreatedRef = useRef(onDialogueCreated);

  // Обновляем ref при изменении dialogueId
  useEffect(() => {
    dialogueIdRef.current = dialogueId || null;
  }, [dialogueId]);

  // Обновляем ref для callback
  useEffect(() => {
    onDialogueCreatedRef.current = onDialogueCreated;
  }, [onDialogueCreated]);

  // Проверка принадлежности события к текущему диалогу или активному стриму
  // Используем refs чтобы всегда иметь актуальные значения
  const isEventForCurrentDialogue = useCallback((eventDialogueId: string) => {
    // Если есть активный стрим - проверяем его ID
    if (activeStreamDialogueIdRef.current) {
      return eventDialogueId === activeStreamDialogueIdRef.current;
    }
    // Если нет dialogueId - принимаем все события (новый диалог)
    if (!dialogueIdRef.current) return true;
    // Иначе проверяем совпадение
    return eventDialogueId === dialogueIdRef.current;
  }, []);

  // Подписка на события Socket.IO - один useEffect для всех событий
  // Не зависит от dialogueId чтобы избежать переподписки
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('[useAIChat] Socket not ready:', { hasSocket: !!socket, isConnected });
      return;
    }

    console.log('[useAIChat] Setting up socket event listeners');

    // Обработка начала стрима
    const handleStreamStart = (data: { dialogueId: string }) => {
      console.log('[useAIChat] ai:stream:start received:', {
        eventDialogueId: data.dialogueId,
        currentDialogueId: dialogueIdRef.current,
        activeStreamRef: activeStreamDialogueIdRef.current,
      });

      // Запоминаем ID диалога для этого стрима
      activeStreamDialogueIdRef.current = data.dialogueId;

      setIsWaitingForResponse(false);
      setIsStreaming(true);
      setError(null);
      currentStreamRef.current = '';

      // Создаём placeholder для ответа ассистента
      const messageId = `assistant-${Date.now()}`;
      streamMessageIdRef.current = messageId;

      setMessages((prev) => [
        ...prev,
        { id: messageId, role: 'assistant', content: '' },
      ]);

      // Уведомляем о создании диалога если это новый
      if (!dialogueIdRef.current && onDialogueCreatedRef.current) {
        onDialogueCreatedRef.current(data.dialogueId);
      }
    };

    // Обработка чанков стрима
    const handleStreamChunk = (data: { dialogueId: string; chunk: string }) => {
      const isForCurrent = isEventForCurrentDialogue(data.dialogueId);
      console.log('[useAIChat] ai:stream:chunk received:', {
        eventDialogueId: data.dialogueId,
        isForCurrent,
        chunkLength: data.chunk?.length,
        activeStreamRef: activeStreamDialogueIdRef.current,
      });

      if (!isForCurrent) return;

      currentStreamRef.current += data.chunk;

      // Обновляем последнее сообщение ассистента
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamMessageIdRef.current
            ? { ...msg, content: currentStreamRef.current }
            : msg
        )
      );
    };

    // Обработка завершения стрима
    const handleStreamEnd = (data: { dialogueId: string; fullMessage: string }) => {
      const isForCurrent = isEventForCurrentDialogue(data.dialogueId);
      console.log('[useAIChat] ai:stream:end received:', {
        eventDialogueId: data.dialogueId,
        isForCurrent,
        fullMessageLength: data.fullMessage?.length,
        activeStreamRef: activeStreamDialogueIdRef.current,
      });

      if (!isForCurrent) return;

      setIsStreaming(false);
      setIsWaitingForResponse(false);

      // Финальное обновление с полным сообщением
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamMessageIdRef.current
            ? { ...msg, content: data.fullMessage }
            : msg
        )
      );

      currentStreamRef.current = '';
      streamMessageIdRef.current = null;
      activeStreamDialogueIdRef.current = null;
    };

    // Обработка вызова инструмента
    const handleToolCall = (data: {
      dialogueId: string;
      toolCallId: string;
      toolName: string;
      args: Record<string, unknown>;
    }) => {
      const isForCurrent = isEventForCurrentDialogue(data.dialogueId);
      console.log('[useAIChat] ai:tool:call received:', {
        eventDialogueId: data.dialogueId,
        isForCurrent,
        toolName: data.toolName,
      });

      if (!isForCurrent) return;

      // Добавляем tool call к текущему сообщению ассистента
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === streamMessageIdRef.current) {
            const existingToolCalls = msg.toolCalls || [];
            return {
              ...msg,
              toolCalls: [
                ...existingToolCalls,
                {
                  id: data.toolCallId,
                  name: data.toolName,
                  arguments: data.args,
                  status: 'running' as const,
                },
              ],
            };
          }
          return msg;
        })
      );
    };

    // Обработка результата инструмента
    const handleToolResult = (data: {
      dialogueId: string;
      toolCallId: string;
      result: unknown;
      error?: string;
    }) => {
      const isForCurrent = isEventForCurrentDialogue(data.dialogueId);
      console.log('[useAIChat] ai:tool:result received:', {
        eventDialogueId: data.dialogueId,
        isForCurrent,
        toolCallId: data.toolCallId,
        hasError: !!data.error,
      });

      if (!isForCurrent) return;

      // Обновляем статус и результат tool call
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === streamMessageIdRef.current && msg.toolCalls) {
            return {
              ...msg,
              toolCalls: msg.toolCalls.map((tc) =>
                tc.id === data.toolCallId
                  ? {
                      ...tc,
                      status: data.error ? 'error' as const : 'completed' as const,
                      result: data.result,
                      error: data.error,
                    }
                  : tc
              ),
            };
          }
          return msg;
        })
      );
    };

    // Обработка ошибок
    const handleStreamError = (data: { dialogueId: string; error: string }) => {
      const isForCurrent = isEventForCurrentDialogue(data.dialogueId);
      console.log('[useAIChat] ai:stream:error received:', {
        eventDialogueId: data.dialogueId,
        isForCurrent,
        error: data.error,
        activeStreamRef: activeStreamDialogueIdRef.current,
      });

      if (!isForCurrent) return;

      setIsStreaming(false);
      setIsWaitingForResponse(false);
      setError(data.error);

      // Удаляем placeholder сообщение при ошибке
      if (streamMessageIdRef.current) {
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== streamMessageIdRef.current)
        );
        streamMessageIdRef.current = null;
      }
      activeStreamDialogueIdRef.current = null;
    };

    // Подписываемся на события
    socket.on('ai:stream:start', handleStreamStart);
    socket.on('ai:stream:chunk', handleStreamChunk);
    socket.on('ai:stream:end', handleStreamEnd);
    socket.on('ai:stream:error', handleStreamError);
    socket.on('ai:tool:call', handleToolCall);
    socket.on('ai:tool:result', handleToolResult);

    // Отписываемся при размонтировании
    return () => {
      console.log('[useAIChat] Cleaning up socket event listeners');
      socket.off('ai:stream:start', handleStreamStart);
      socket.off('ai:stream:chunk', handleStreamChunk);
      socket.off('ai:stream:end', handleStreamEnd);
      socket.off('ai:stream:error', handleStreamError);
      socket.off('ai:tool:call', handleToolCall);
      socket.off('ai:tool:result', handleToolResult);
    };
  }, [socket, isConnected, isEventForCurrentDialogue]);

  // Отправка сообщения
  const sendMessage = useCallback(
    (content: string, overrideDialogueId?: string) => {
      console.log('[useAIChat] sendMessage called:', {
        hasSocket: !!socket,
        isAuthenticated,
        isStreaming,
        dialogueId: dialogueIdRef.current,
        overrideDialogueId,
      });

      if (!socket || !isAuthenticated || isStreaming) {
        console.log('[useAIChat] sendMessage blocked:', {
          noSocket: !socket,
          notAuthenticated: !isAuthenticated,
          isStreaming,
        });
        return;
      }

      // Используем переданный dialogueId или из ref
      const targetDialogueId = overrideDialogueId || dialogueIdRef.current;

      // Если передан override - запоминаем его для отслеживания стрима
      if (overrideDialogueId) {
        activeStreamDialogueIdRef.current = overrideDialogueId;
        console.log('[useAIChat] Set activeStreamDialogueIdRef to:', overrideDialogueId);
      }

      // Добавляем сообщение пользователя локально
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Устанавливаем состояние ожидания ответа
      setIsWaitingForResponse(true);

      // Отправляем через сокет
      console.log('[useAIChat] Emitting ai:message:send with dialogueId:', targetDialogueId);
      socket.emit('ai:message:send', {
        dialogueId: targetDialogueId || undefined,
        message: content,
      });
    },
    [socket, isAuthenticated, isStreaming]
  );

  // Отмена стрима
  const cancelStream = useCallback(() => {
    if (!socket || !dialogueIdRef.current) return;

    socket.emit('ai:stream:cancel', { dialogueId: dialogueIdRef.current });
    setIsStreaming(false);
  }, [socket]);

  // Загрузка истории диалога
  const loadHistory = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/ai-dialogues/${id}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          interface ToolCallFromAPI {
            id: string;
            name: string;
            arguments?: Record<string, unknown>;
            result?: unknown;
            error?: string;
            status?: 'pending' | 'running' | 'completed' | 'error';
          }
          interface DialogueMessageFromAPI {
            _id?: string;
            role: 'user' | 'assistant';
            content: string;
            toolCalls?: ToolCallFromAPI[];
          }
          const historyMessages: Message[] = data.dialogue.messages.map(
            (msg: DialogueMessageFromAPI) => ({
              id: msg._id || `msg-${Date.now()}-${Math.random()}`,
              role: msg.role,
              content: msg.content,
              toolCalls: msg.toolCalls?.map((tc) => ({
                id: tc.id,
                name: tc.name,
                arguments: tc.arguments || {},
                result: tc.result,
                error: tc.error,
                status: tc.status || 'completed' as const,
              })),
            })
          );
          setMessages(historyMessages);
        }
      } catch (err) {
        console.error('[useAIChat] Failed to load history:', err);
      }
    },
    []
  );

  // Очистка сообщений
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    setMessages,
    isStreaming,
    isWaitingForResponse,
    isConnected,
    isAuthenticated,
    error,
    sendMessage,
    cancelStream,
    loadHistory,
    clearMessages,
  };
}
