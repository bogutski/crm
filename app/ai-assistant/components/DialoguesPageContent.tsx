'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { DialogueChat } from './DialogueChat';

interface Dialogue {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    totalMessages: number;
  };
}

export function DialoguesPageContent() {
  const [selectedDialogueId, setSelectedDialogueId] = useState<string | null>(null);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем список диалогов
  const loadDialogues = async () => {
    try {
      const response = await fetch('/api/ai-dialogues', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDialogues(data.dialogues || []);
      }
    } catch (error) {
      console.error('Failed to load dialogues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDialogues().then(() => {
      // После загрузки выбираем первый (последний по дате) диалог
    });
  }, []);

  // Автовыбор первого диалога после загрузки
  useEffect(() => {
    if (!isLoading && dialogues.length > 0 && selectedDialogueId === null) {
      setSelectedDialogueId(dialogues[0]._id);
    }
  }, [isLoading, dialogues, selectedDialogueId]);

  // Создать новый диалог
  const handleNewDialogue = async () => {
    try {
      const response = await fetch('/api/ai-dialogues', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedDialogueId(data.dialogue._id);
        // Добавляем новый диалог в начало списка
        setDialogues(prev => [data.dialogue, ...prev]);
      }
    } catch (error) {
      console.error('Failed to create dialogue:', error);
    }
  };

  // Удалить диалог
  const handleDeleteDialogue = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Удалить этот диалог?')) return;

    try {
      const response = await fetch(`/api/ai-dialogues/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const newDialogues = dialogues.filter(d => d._id !== id);
        setDialogues(newDialogues);

        if (selectedDialogueId === id) {
          // Если удалили текущий диалог - выбираем первый из оставшихся или null
          setSelectedDialogueId(newDialogues.length > 0 ? newDialogues[0]._id : null);
        }
      }
    } catch (error) {
      console.error('Failed to delete dialogue:', error);
    }
  };

  // Обновить список после отправки сообщения (когда создан новый диалог)
  const handleDialogueUpdate = (dialogueId: string) => {
    loadDialogues();
    setSelectedDialogueId(dialogueId);
  };

  // Определяем, есть ли диалоги
  const hasDialogues = dialogues.length > 0;

  return (
    <div className="flex flex-1 min-h-0 gap-6">
      {/* Left sidebar - Dialogues */}
      <div className="w-56 flex-shrink-0 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 px-2">
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Диалоги
          </h3>
          {/* Кнопка + только если есть диалоги */}
          {hasDialogues && (
            <button
              onClick={handleNewDialogue}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              title="Новый диалог"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
          </div>
        ) : !hasDialogues ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-2">
            <MessageSquare className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Напишите сообщение чтобы начать
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {dialogues.map((dialogue) => (
              <div key={dialogue._id} className="relative group">
                <button
                  onClick={() => setSelectedDialogueId(dialogue._id)}
                  className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 text-left pr-8 ${
                    selectedDialogueId === dialogue._id
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate flex-1">{dialogue.title}</span>
                </button>
                <button
                  onClick={(e) => handleDeleteDialogue(dialogue._id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-opacity"
                  title="Удалить диалог"
                >
                  <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content - Chat */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <DialogueChat
          dialogueId={selectedDialogueId}
          onDialogueUpdate={handleDialogueUpdate}
          showInputWhenEmpty={!hasDialogues}
        />
      </div>
    </div>
  );
}
