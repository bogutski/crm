'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/Button';

interface DialogueChatProps {
  dialogueId: string | null;
  onDialogueUpdate: (dialogueId: string) => void;
}

export function DialogueChat({ dialogueId, onDialogueUpdate }: DialogueChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    api: '/api/chat',
    body: { dialogueId },
    onResponse: (response) => {
      const newDialogueId = response.headers.get('X-Dialogue-ID');
      if (newDialogueId) {
        onDialogueUpdate(newDialogueId);
      }
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Загрузка истории при выборе диалога
  useEffect(() => {
    if (dialogueId) {
      loadDialogueHistory(dialogueId);
    } else {
      setMessages([]);
    }
  }, [dialogueId, setMessages]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDialogueHistory = async (id: string) => {
    try {
      console.log('[DialogueChat] Loading dialogue:', id);
      const response = await fetch(`/api/dialogues/${id}`, {
        credentials: 'include',
      });

      console.log('[DialogueChat] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[DialogueChat] Response data:', data);
        const dialogue = data.dialogue;

        if (!dialogue || !dialogue.messages) {
          console.error('[DialogueChat] Invalid dialogue data:', dialogue);
          return;
        }

        console.log('[DialogueChat] Messages count:', dialogue.messages.length);

        // Конвертируем историю в формат для useChat
        const historyMessages = dialogue.messages.map((msg: any, index: number) => {
          console.log('[DialogueChat] Message', index, ':', msg);
          return {
            id: msg._id || Math.random().toString(),
            role: msg.role,
            content: msg.content,
          };
        });

        console.log('[DialogueChat] Setting messages:', historyMessages);
        setMessages(historyMessages);
      } else {
        console.error('[DialogueChat] Failed to load dialogue:', response.status);
      }
    } catch (error) {
      console.error('[DialogueChat] Error loading dialogue history:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({ text: input });
    setInput('');
  };

  // Empty state
  if (!dialogueId && messages.length === 0) {
    return (
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
            Выберите диалог из списка или начните новый разговор
          </p>
          <div className="text-xs text-left space-y-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
            <p className="font-medium">Я могу помочь вам с:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Аналитикой данных CRM</li>
              <li>Ответами на вопросы о системе</li>
              <li>Рекомендациями по работе</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите сообщение..."
              className="flex-1 px-4 py-3 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
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
        </form>
      </div>
    </>
  );
}
