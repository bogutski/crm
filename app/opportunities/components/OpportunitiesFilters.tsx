'use client';

import { useEffect, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { ColorSelect, type ColorOption } from '@/components/ui/ColorSelect';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Priority {
  id: string;
  name: string;
  properties: { color?: string };
}

interface Stage {
  id: string;
  name: string;
  color: string;
}

interface OpportunitiesFiltersProps {
  pipelineId?: string | null;
  stages?: Stage[];
  ownerId?: string;
  priorityId?: string;
  stageId?: string;
  onFilterChange: (filters: {
    ownerId: string | undefined;
    priorityId: string | undefined;
    stageId: string | undefined;
  }) => void;
}

export function OpportunitiesFilters({
  pipelineId,
  stages = [],
  ownerId,
  priorityId,
  stageId,
  onFilterChange,
}: OpportunitiesFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);

  // Load users and priorities
  useEffect(() => {
    Promise.all([
      fetch('/api/users/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 100 }),
      }).then(r => r.ok ? r.json() : { users: [] }),
      fetch('/api/dictionaries/opportunity_priority/items').then(r => r.ok ? r.json() : { items: [] }),
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

  const stageOptions: ColorOption[] = stages.map(s => ({
    value: s.id,
    label: s.name,
    color: s.color,
  }));

  const handleOwnerChange = (value: string) => {
    onFilterChange({
      ownerId: value || undefined,
      priorityId,
      stageId,
    });
  };

  const handlePriorityChange = (value: string) => {
    onFilterChange({
      ownerId,
      priorityId: value || undefined,
      stageId,
    });
  };

  const handleStageChange = (value: string) => {
    onFilterChange({
      ownerId,
      priorityId,
      stageId: value || undefined,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      ownerId: undefined,
      priorityId: undefined,
      stageId: undefined,
    });
  };

  const hasActiveFilters = ownerId || priorityId || stageId;
  const activeFiltersCount = [ownerId, priorityId, stageId].filter(Boolean).length;

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

            {/* Owner Filter */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Владелец
              </label>
              <ColorSelect
                options={userOptions}
                value={ownerId || ''}
                onChange={handleOwnerChange}
                placeholder="Все владельцы"
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

            {/* Stage Filter */}
            {pipelineId && stages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Этап
                </label>
                <ColorSelect
                  options={stageOptions}
                  value={stageId || ''}
                  onChange={handleStageChange}
                  placeholder="Все этапы"
                />
              </div>
            )}

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
