'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { DialogueChat } from './DialogueChat';

interface Dialogue {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
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
      const response = await fetch('/api/dialogues', {
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
    loadDialogues();
  }, []);

  // Создать новый диалог
  const handleNewDialogue = () => {
    setSelectedDialogueId(null);
  };

  // Удалить диалог
  const handleDeleteDialogue = async (id: string) => {
    if (!confirm('Удалить этот диалог?')) return;

    try {
      const response = await fetch(`/api/dialogues/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setDialogues(prev => prev.filter(d => d._id !== id));
        if (selectedDialogueId === id) {
          setSelectedDialogueId(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete dialogue:', error);
    }
  };

  // Обновить список после отправки сообщения
  const handleDialogueUpdate = (dialogueId: string) => {
    loadDialogues();
    if (!selectedDialogueId) {
      setSelectedDialogueId(dialogueId);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 gap-6">
      {/* Left sidebar - Dialogues */}
      <div className="w-56 flex-shrink-0 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 px-2">
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Диалоги
          </h3>
          <button
            onClick={handleNewDialogue}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            title="Новый диалог"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-0.5">
            <button
              onClick={handleNewDialogue}
              className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 text-left ${
                selectedDialogueId === null
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50'
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Новый диалог</span>
            </button>
            {dialogues.map((dialogue) => (
              <div key={dialogue._id} className="relative group">
                <button
                  onClick={() => setSelectedDialogueId(dialogue._id)}
                  className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 text-left ${
                    selectedDialogueId === dialogue._id
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate flex-1">{dialogue.title}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDialogue(dialogue._id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-opacity"
                  title="Удалить"
                >
                  <svg
                    className="w-3 h-3 text-zinc-500 dark:text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
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
        />
      </div>
    </div>
  );
}
