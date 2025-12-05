'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Settings } from 'lucide-react';
import { useAIChat } from '@/lib/socket/client';
import { useSocket } from '@/lib/socket/client';
import { MarkdownMessage } from './MarkdownMessage';
import { ToolCallDisplay } from './ToolCallDisplay';

interface DialogueChatProps {
  dialogueId: string | null;
  onDialogueUpdate: (dialogueId: string) => void;
  showInputWhenEmpty?: boolean; // Показывать поле ввода даже если нет диалога (для первого сообщения)
}

interface AISettings {
  activeProvider?: string;
  providers: {
    openai?: { enabled: boolean; model: string; hasApiKey: boolean };
    anthropic?: { enabled: boolean; model: string; hasApiKey: boolean };
    google?: { enabled: boolean; model: string; hasApiKey: boolean };
  };
}

export function DialogueChat({ dialogueId, onDialogueUpdate, showInputWhenEmpty = false }: DialogueChatProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [isCheckingSettings, setIsCheckingSettings] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected } = useSocket();

  const {
    messages,
    setMessages,
    isStreaming,
    isWaitingForResponse,
    error,
    sendMessage,
    loadHistory,
    clearMessages,
  } = useAIChat({
    dialogueId,
    onDialogueCreated: onDialogueUpdate,
  });

  // Проверка настроек AI провайдера
  useEffect(() => {
    async function checkAISettings() {
      try {
        const response = await fetch('/api/system-settings', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setAiSettings(data.ai || null);
        }
      } catch (error) {
        console.error('Failed to check AI settings:', error);
      } finally {
        setIsCheckingSettings(false);
      }
    }
    checkAISettings();
  }, []);

  // Проверяем, есть ли активное валидное подключение
  const hasValidConnection = aiSettings?.activeProvider &&
    aiSettings.providers[aiSettings.activeProvider as keyof typeof aiSettings.providers]?.hasApiKey;

  // Ref чтобы отслеживать только что созданный диалог (не загружать для него историю)
  const justCreatedDialogueRef = useRef<string | null>(null);

  // Загрузка истории при выборе диалога
  useEffect(() => {
    if (dialogueId) {
      // Не загружаем историю для только что созданного диалога
      if (justCreatedDialogueRef.current === dialogueId) {
        justCreatedDialogueRef.current = null;
        return;
      }
      loadHistory(dialogueId);
    } else {
      clearMessages();
    }
  }, [dialogueId, loadHistory, clearMessages]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || isWaitingForResponse || !hasValidConnection || !isConnected) return;

    const messageText = input;
    setInput('');

    // Если нет диалога - создаём его сначала
    if (!dialogueId) {
      try {
        const response = await fetch('/api/ai-dialogues', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const newDialogueId = data.dialogue._id;
          // Запоминаем что этот диалог только что создан - не нужно загружать историю
          justCreatedDialogueRef.current = newDialogueId;
          // Уведомляем родителя о новом диалоге
          onDialogueUpdate(newDialogueId);
          // Отправляем сообщение с явным указанием нового dialogueId
          sendMessage(messageText, newDialogueId);
        }
      } catch (error) {
        console.error('Failed to create dialogue:', error);
      }
    } else {
      sendMessage(messageText);
    }
  };

  // Компонент для отображения сообщения о необходимости настроить AI
  const NoConnectionMessage = () => (
    <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex-shrink-0">
            <Settings className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              AI провайдер не настроен
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Для использования ассистента необходимо подключить AI провайдера
            </p>
          </div>
          <Button
            onClick={() => router.push('/settings/ai')}
            variant="secondary"
            className="flex-shrink-0"
          >
            Настроить
          </Button>
      </div>
    </div>
  );

  // JSX для формы ввода (не компонент, чтобы избежать пересоздания при ре-рендере)
  const inputFormJSX = (
    <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isConnected ? "Напишите сообщение..." : "Подключение..."}
            className="flex-1 px-4 py-3 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isStreaming || isWaitingForResponse || !isConnected}
          />
          <Button
            type="submit"
            disabled={isStreaming || isWaitingForResponse || !input.trim() || !isConnected}
            className="px-6"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </form>
    </div>
  );

  // Показываем загрузку пока проверяем настройки
  if (isCheckingSettings) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  // Empty state - показываем если нет диалога и не нужно показывать поле ввода
  if (!dialogueId && !showInputWhenEmpty) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
          <div className="text-center max-w-md">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              AI Ассистент
            </h2>
            <p className="text-sm mb-4">
              {hasValidConnection ? 'Нажмите + чтобы начать новый диалог' : 'Настройте AI провайдера для начала работы'}
            </p>
            {!isConnected && (
              <p className="text-xs text-amber-500 mb-4">
                Подключение к серверу...
              </p>
            )}
            {hasValidConnection && (
              <div className="text-xs text-left space-y-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                <p className="font-medium">Я могу помочь вам с:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Аналитикой данных CRM</li>
                  <li>Ответами на вопросы о системе</li>
                  <li>Рекомендациями по работе</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {!hasValidConnection && <NoConnectionMessage />}
      </>
    );
  }

  // Начальное состояние без диалогов - показываем приветствие и поле ввода
  if (!dialogueId && showInputWhenEmpty) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
          <div className="text-center max-w-md">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              AI Ассистент
            </h2>
            {!isConnected && (
              <p className="text-xs text-amber-500 mb-4">
                Подключение к серверу...
              </p>
            )}
            {hasValidConnection && (
              <div className="text-xs text-left space-y-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                <p className="font-medium">Я могу помочь вам с:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Аналитикой данных CRM</li>
                  <li>Ответами на вопросы о системе</li>
                  <li>Рекомендациями по работе</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {hasValidConnection ? inputFormJSX : <NoConnectionMessage />}
      </>
    );
  }

  return (
    <>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {/* Empty chat placeholder */}
          {messages.length === 0 && !isStreaming && (
            <div className="flex items-center justify-center h-full min-h-[200px] text-zinc-400 dark:text-zinc-500">
              <p className="text-sm">Напишите сообщение чтобы начать диалог</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white max-w-[80%]'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-50'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                ) : (
                  <>
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <ToolCallDisplay toolCalls={message.toolCalls} />
                    )}
                    <MarkdownMessage content={message.content} />
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Показываем спиннер когда ожидаем ответ */}
          {isWaitingForResponse && (
            <div className="flex justify-start">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-zinc-400">Обработка...</span>
                </div>
              </div>
            </div>
          )}

          {/* Показываем индикатор когда идёт стриминг и есть tool calls без финального текста */}
          {isStreaming && !isWaitingForResponse && (() => {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.role !== 'assistant') return null;

            const hasToolCalls = lastMsg.toolCalls && lastMsg.toolCalls.length > 0;
            const hasRunningTools = lastMsg.toolCalls?.some(tc => tc.status === 'running');
            const hasNoContent = !lastMsg.content || lastMsg.content.trim() === '';

            // Показываем спиннер если:
            // 1. Есть running tools (инструмент выполняется)
            // 2. ИЛИ есть tool calls но нет текста (AI ещё думает после получения результатов)
            if (hasRunningTools || (hasToolCalls && hasNoContent)) {
              return (
                <div className="flex justify-start mt-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <div className="w-3 h-3 border-2 border-zinc-300 border-t-zinc-500 rounded-full animate-spin"></div>
                    <span>{hasRunningTools ? 'Выполняю запрос...' : 'Анализирую данные...'}</span>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area or no connection message */}
      {hasValidConnection ? inputFormJSX : <NoConnectionMessage />}
    </>
  );
}
