'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, User, Briefcase, CheckSquare, ChevronRight, Search, Loader2, LayoutGrid } from 'lucide-react';
import { SearchResults } from './GlobalSearch';

type CategoryFilter = 'all' | 'contacts' | 'opportunities' | 'tasks';

interface SearchResultsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  results: SearchResults | null;
  query: string;
  onQueryChange: (value: string) => void;
  isLoading: boolean;
}

const statusLabels: Record<string, string> = {
  open: 'Открыта',
  in_progress: 'В работе',
  completed: 'Выполнена',
  cancelled: 'Отменена',
};

function formatAmount(amount?: number): string {
  if (!amount) return '';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SearchResultsSidebar({
  isOpen,
  onClose,
  results,
  query,
  onQueryChange,
  isLoading,
}: SearchResultsSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setActiveFilter('all');
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalResults = results
    ? results.contacts.total + results.opportunities.total + results.tasks.total
    : 0;

  const hasResults = totalResults > 0;
  const hasQuery = query.trim().length >= 1;

  const categories = [
    {
      id: 'all' as const,
      label: 'Все результаты',
      icon: LayoutGrid,
      count: totalResults,
      color: 'text-zinc-500',
    },
    {
      id: 'contacts' as const,
      label: 'Контакты',
      icon: User,
      count: results?.contacts.total || 0,
      color: 'text-blue-500',
    },
    {
      id: 'opportunities' as const,
      label: 'Сделки',
      icon: Briefcase,
      count: results?.opportunities.total || 0,
      color: 'text-green-500',
    },
    {
      id: 'tasks' as const,
      label: 'Задачи',
      icon: CheckSquare,
      count: results?.tasks.total || 0,
      color: 'text-purple-500',
    },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="
          fixed top-0 right-0 h-full w-[700px]
          bg-white dark:bg-zinc-900
          border-l border-zinc-200 dark:border-zinc-800
          shadow-xl z-50
          flex flex-col
        "
      >
        {/* Header with search input */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Поиск по контактам, сделкам, задачам..."
                className="
                  w-full pl-10 pr-10 py-2.5
                  text-sm
                  border rounded-lg
                  bg-zinc-50 dark:bg-zinc-800
                  text-zinc-900 dark:text-zinc-50
                  placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                  border-zinc-200 dark:border-zinc-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  focus:bg-white dark:focus:bg-zinc-900
                "
              />
              {isLoading ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 animate-spin" />
              ) : query ? (
                <button
                  onClick={() => onQueryChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - categories */}
          <div className="w-48 border-r border-zinc-100 dark:border-zinc-800 py-2 flex-shrink-0">
            {categories.map((cat, index) => {
              const Icon = cat.icon;
              const isActive = activeFilter === cat.id;
              const isDisabled = cat.id !== 'all' && cat.count === 0;

              return (
                <div key={cat.id}>
                  <button
                    onClick={() => !isDisabled && setActiveFilter(cat.id)}
                    disabled={isDisabled}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 text-left text-sm
                      transition-colors
                      ${isActive
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                        : isDisabled
                          ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isDisabled ? 'text-zinc-300 dark:text-zinc-600' : cat.color}`} />
                      <span>{cat.label}</span>
                    </div>
                    {hasQuery && (
                      <span className={`
                        text-xs px-1.5 py-0.5 rounded
                        ${isActive
                          ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                        }
                      `}>
                        {cat.count}
                      </span>
                    )}
                  </button>

                  {/* Spacing after "All results" */}
                  {index === 0 && (
                    <div className="my-3" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right content - results */}
          <div className="flex-1 overflow-y-auto">
            {!hasQuery ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500">
                <Search className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Введите запрос для поиска</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
              </div>
            ) : !hasResults ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500">
                <p className="text-sm">Ничего не найдено по запросу</p>
                <p className="text-sm font-medium mt-1">&quot;{query}&quot;</p>
              </div>
            ) : (
              <div className="py-2">
                {/* All results view */}
                {activeFilter === 'all' && (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {results && results.contacts.total > 0 && (
                      <ResultSection
                        title="Контакты"
                        icon={User}
                        iconColor="text-blue-500"
                        count={results.contacts.total}
                        onShowAll={() => setActiveFilter('contacts')}
                      >
                        {results.contacts.items.slice(0, 3).map((contact) => (
                          <ContactItem key={contact.id} contact={contact} onClose={onClose} />
                        ))}
                      </ResultSection>
                    )}

                    {results && results.opportunities.total > 0 && (
                      <ResultSection
                        title="Сделки"
                        icon={Briefcase}
                        iconColor="text-green-500"
                        count={results.opportunities.total}
                        onShowAll={() => setActiveFilter('opportunities')}
                      >
                        {results.opportunities.items.slice(0, 3).map((opp) => (
                          <OpportunityItem key={opp.id} opportunity={opp} onClose={onClose} />
                        ))}
                      </ResultSection>
                    )}

                    {results && results.tasks.total > 0 && (
                      <ResultSection
                        title="Задачи"
                        icon={CheckSquare}
                        iconColor="text-purple-500"
                        count={results.tasks.total}
                        onShowAll={() => setActiveFilter('tasks')}
                      >
                        {results.tasks.items.slice(0, 3).map((task) => (
                          <TaskItem key={task.id} task={task} onClose={onClose} />
                        ))}
                      </ResultSection>
                    )}
                  </div>
                )}

                {/* Contacts only */}
                {activeFilter === 'contacts' && results && (
                  <div className="px-3">
                    <div className="space-y-1">
                      {results.contacts.items.map((contact) => (
                        <ContactItem key={contact.id} contact={contact} onClose={onClose} />
                      ))}
                    </div>
                    {results.contacts.total > results.contacts.items.length && (
                      <Link
                        href={`/contacts?search=${encodeURIComponent(query)}`}
                        onClick={onClose}
                        className="block mt-3 py-2 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Показать все {results.contacts.total} контактов
                      </Link>
                    )}
                  </div>
                )}

                {/* Opportunities only */}
                {activeFilter === 'opportunities' && results && (
                  <div className="px-3">
                    <div className="space-y-1">
                      {results.opportunities.items.map((opp) => (
                        <OpportunityItem key={opp.id} opportunity={opp} onClose={onClose} />
                      ))}
                    </div>
                    {results.opportunities.total > results.opportunities.items.length && (
                      <Link
                        href={`/opportunities?search=${encodeURIComponent(query)}`}
                        onClick={onClose}
                        className="block mt-3 py-2 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Показать все {results.opportunities.total} сделок
                      </Link>
                    )}
                  </div>
                )}

                {/* Tasks only */}
                {activeFilter === 'tasks' && results && (
                  <div className="px-3">
                    <div className="space-y-1">
                      {results.tasks.items.map((task) => (
                        <TaskItem key={task.id} task={task} onClose={onClose} />
                      ))}
                    </div>
                    {results.tasks.total > results.tasks.items.length && (
                      <Link
                        href={`/tasks?search=${encodeURIComponent(query)}`}
                        onClick={onClose}
                        className="block mt-3 py-2 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Показать все {results.tasks.total} задач
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Section component for "All" view
function ResultSection({
  title,
  icon: Icon,
  iconColor,
  count,
  onShowAll,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  count: number;
  onShowAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="py-3">
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {title}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {count}
          </span>
        </div>
        {count > 3 && (
          <button
            onClick={onShowAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Показать все
          </button>
        )}
      </div>
      <div className="px-3 space-y-1">
        {children}
      </div>
    </section>
  );
}

// Individual result items
function ContactItem({
  contact,
  onClose,
}: {
  contact: { id: string; name: string; company?: string; email?: string };
  onClose: () => void;
}) {
  return (
    <Link
      href={`/contacts/${contact.id}`}
      onClick={onClose}
      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
          {contact.name}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {contact.company || contact.email || '—'}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 flex-shrink-0" />
    </Link>
  );
}

function OpportunityItem({
  opportunity,
  onClose,
}: {
  opportunity: { id: string; name?: string; amount?: number; stage?: string };
  onClose: () => void;
}) {
  return (
    <Link
      href={`/opportunities/${opportunity.id}`}
      onClick={onClose}
      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
          {opportunity.name || 'Без названия'}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {opportunity.stage || '—'}
          {opportunity.amount ? ` • ${formatAmount(opportunity.amount)}` : ''}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 flex-shrink-0" />
    </Link>
  );
}

function TaskItem({
  task,
  onClose,
}: {
  task: { id: string; title: string; status: string; dueDate?: Date };
  onClose: () => void;
}) {
  return (
    <Link
      href={`/tasks?taskId=${task.id}`}
      onClick={onClose}
      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
          {task.title}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {statusLabels[task.status] || task.status}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 flex-shrink-0" />
    </Link>
  );
}
