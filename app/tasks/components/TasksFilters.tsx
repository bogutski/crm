'use client';

import { useEffect, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { ColorSelect, type ColorOption } from '@/components/ui/ColorSelect';

interface User {
  id: string;
  name: string;
  email: string;
}

interface DictionaryItem {
  id: string;
  name: string;
  properties: { color?: string };
}

interface TasksFiltersProps {
  assigneeId?: string;
  priorityId?: string;
  onFilterChange: (filters: {
    assigneeId?: string;
    priorityId?: string;
  }) => void;
}

export function TasksFilters({
  assigneeId,
  priorityId,
  onFilterChange,
}: TasksFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [priorities, setPriorities] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load users and priorities
  useEffect(() => {
    Promise.all([
      fetch('/api/users/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 100 }),
      }).then(r => r.ok ? r.json() : { users: [] }),
      fetch('/api/dictionaries/task_priority/items').then(r => r.ok ? r.json() : { items: [] }),
    ]).then(([usersData, prioritiesData]) => {
      setUsers(usersData.users || []);
      setPriorities(prioritiesData.items || []);
      setLoading(false);
    });
  }, []);

  const userOptions: ColorOption[] = users.map(u => ({
    value: u.id,
    label: u.name,
  }));

  const priorityOptions: ColorOption[] = priorities.map(p => ({
    value: p.id,
    label: p.name,
    color: p.properties.color,
  }));

  const handleAssigneeChange = (value: string) => {
    onFilterChange({
      assigneeId: value || undefined,
      priorityId,
    });
  };

  const handlePriorityChange = (value: string) => {
    onFilterChange({
      assigneeId,
      priorityId: value || undefined,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      assigneeId: undefined,
      priorityId: undefined,
    });
  };

  const hasActiveFilters = assigneeId || priorityId;
  const activeFiltersCount = [assigneeId, priorityId].filter(Boolean).length;

  if (loading) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors ${
          hasActiveFilters
            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>Фильтры</span>
        {activeFiltersCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-blue-600 text-white">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-20 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Фильтры
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Assignee Filter */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Ответственный
              </label>
              <ColorSelect
                options={userOptions}
                value={assigneeId || ''}
                onChange={handleAssigneeChange}
                placeholder="Все ответственные"
              />
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Приоритет
              </label>
              <ColorSelect
                options={priorityOptions}
                value={priorityId || ''}
                onChange={handlePriorityChange}
                placeholder="Все приоритеты"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={handleClearFilters}
                  className="w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
                >
                  Сбросить все фильтры
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
