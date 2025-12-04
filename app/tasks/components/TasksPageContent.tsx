'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FolderKanban, ListTodo, Plus, X, SquareKanban, Table } from 'lucide-react';
import { TasksTable } from './TasksTable';
import { TasksSearch } from './TasksSearch';
import { CreateTaskButton } from './CreateTaskButton';
import { TasksKanban } from './TasksKanban';

interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
}

type TaskStatusFilter = 'all' | 'open' | 'in_progress' | 'completed' | 'cancelled';
type ViewMode = 'table' | 'kanban';

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
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

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

  const handleCreateProject = useCallback(async () => {
    if (!newProjectName.trim() || isCreatingProject) return;

    setIsCreatingProject(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects(prev => [...prev, newProject]);
        setNewProjectName('');
        setShowCreateProject(false);
        // Select the newly created project
        handleProjectChange(newProject.id);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsCreatingProject(false);
    }
  }, [newProjectName, isCreatingProject, handleProjectChange]);

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
        <div className="flex items-center justify-between mb-2 px-2">
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Проекты
          </h3>
          <button
            onClick={() => setShowCreateProject(true)}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            title="Создать проект"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Create project form */}
        {showCreateProject && (
          <div className="mb-2 px-2">
            <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-1">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject();
                  if (e.key === 'Escape') {
                    setShowCreateProject(false);
                    setNewProjectName('');
                  }
                }}
                placeholder="Название проекта"
                className="flex-1 min-w-0 px-2 py-1.5 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400"
                autoFocus
                disabled={isCreatingProject}
              />
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || isCreatingProject}
                className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setShowCreateProject(false);
                  setNewProjectName('');
                }}
                className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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
            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
                }`}
                title="Таблица"
              >
                <Table className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
                }`}
                title="Kanban"
              >
                <SquareKanban className="w-4 h-4" />
              </button>
            </div>
            <TasksSearch initialSearch={currentSearch} />
            <CreateTaskButton projects={projects} defaultProjectId={selectedProjectId} />
          </div>
        </div>

        {/* Tasks View */}
        {viewMode === 'table' ? (
          <TasksTable
            initialPage={initialPage}
            initialSearch={currentSearch}
            projectId={selectedProjectId}
            status={selectedStatus === 'all' ? null : selectedStatus}
          />
        ) : (
          <TasksKanban
            initialSearch={currentSearch}
            projectId={selectedProjectId}
            status={null}
          />
        )}
      </div>
    </div>
  );
}
