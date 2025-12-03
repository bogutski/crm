'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FolderKanban, ListTodo } from 'lucide-react';
import { TasksTable } from './TasksTable';
import { TasksSearch } from './TasksSearch';
import { CreateTaskButton } from './CreateTaskButton';

interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
}

type TaskStatusFilter = 'all' | 'open' | 'in_progress' | 'completed' | 'cancelled';

interface TasksPageContentProps {
  initialPage?: number;
  initialSearch?: string;
  initialProjectId?: string | null;
  initialStatus?: string | null;
}

const statusLabels: Record<TaskStatusFilter, string> = {
  all: 'Все',
  open: 'Открытые',
  in_progress: 'В работе',
  completed: 'Завершённые',
  cancelled: 'Отменённые',
};

export function TasksPageContent({
  initialPage = 1,
  initialSearch = '',
  initialProjectId = null,
  initialStatus = null,
}: TasksPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatusFilter>(
    (initialStatus as TaskStatusFilter) || 'all'
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active', limit: 100 }),
        });
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);

          // Set project from URL if exists
          const projectFromUrl = searchParams.get('project');
          if (projectFromUrl) {
            const found = data.projects.find((p: Project) => p.id === projectFromUrl);
            if (found) {
              setSelectedProjectId(found.id);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [searchParams]);

  const handleProjectChange = useCallback((projectId: string | null) => {
    setSelectedProjectId(projectId);

    const newParams = new URLSearchParams(searchParams.toString());
    if (projectId) {
      newParams.set('project', projectId);
    } else {
      newParams.delete('project');
    }
    newParams.delete('page');
    router.push(`?${newParams.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleStatusChange = useCallback((status: TaskStatusFilter) => {
    setSelectedStatus(status);

    const newParams = new URLSearchParams(searchParams.toString());
    if (status !== 'all') {
      newParams.set('status', status);
    } else {
      newParams.delete('status');
    }
    newParams.delete('page');
    router.push(`?${newParams.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const currentSearch = searchParams.get('search') || initialSearch;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 gap-6">
      {/* Left sidebar - Projects */}
      <div className="w-56 flex-shrink-0 flex flex-col min-h-0">
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-2">
          Проекты
        </h3>
        <div className="flex-1 overflow-y-auto space-y-0.5">
          <button
            onClick={() => handleProjectChange(null)}
            className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 text-left ${
              selectedProjectId === null
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50'
            }`}
          >
            <ListTodo className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Все задачи</span>
          </button>
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleProjectChange(project.id)}
              className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 text-left ${
                selectedProjectId === project.id
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50'
              }`}
            >
              <FolderKanban className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{project.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {selectedProjectId
                ? projects.find(p => p.id === selectedProjectId)?.name || 'Задачи'
                : 'Все задачи'}
            </h2>

            {/* Status Filter */}
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
              {(Object.keys(statusLabels) as TaskStatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    selectedStatus === status
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
                  }`}
                >
                  {statusLabels[status]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <TasksSearch initialSearch={currentSearch} />
            <CreateTaskButton projects={projects} />
          </div>
        </div>

        {/* Tasks Table */}
        <TasksTable
          initialPage={initialPage}
          initialSearch={currentSearch}
          projectId={selectedProjectId}
          status={selectedStatus === 'all' ? null : selectedStatus}
        />
      </div>
    </div>
  );
}
