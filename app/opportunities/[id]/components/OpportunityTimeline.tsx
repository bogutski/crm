'use client';

import { MessageSquare } from 'lucide-react';

interface OpportunityTimelineProps {
  opportunityId: string;
  contactId?: string;
}

/**
 * OpportunityTimeline - компонент для отображения истории взаимодействий со сделкой
 *
 * Планируемый функционал:
 * - Timeline событий (звонки, встречи, задачи, изменения статуса)
 * - Объединённая история сделки и связанного контакта
 * - Возможность добавления заметок и комментариев
 * - Фильтрация по типу события
 */
export function OpportunityTimeline({ opportunityId, contactId }: OpportunityTimelineProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4 flex-shrink-0">
        История и переписка
      </h2>

      <div className="flex-1 flex flex-col items-center justify-center text-center overflow-y-auto">
        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="w-6 h-6 text-zinc-400" />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
          Timeline и переписка
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-[200px]">
          Здесь будет отображаться история взаимодействий со сделкой
          {contactId && ' и связанным контактом'}
        </p>
      </div>
    </div>
  );
}
