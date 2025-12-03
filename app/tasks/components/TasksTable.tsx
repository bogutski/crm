'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pencil, ChevronLeft, ChevronRight, Trash2, Check, Circle, Clock, XCircle, FolderKanban, User } from 'lucide-react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { TaskForm } from './TaskForm';
import { ContactPreviewPanel } from '@/app/contacts/components/ContactPreviewPanel';
import { Badge } from '@/components/ui/Badge';

interface Priority {
  id: string;
  name: string;
  color?: string;
}

interface Assignee {
  id: string;
  name: string;
  email: string;
}

interface LinkedEntity {
  entityType: 'contact' | 'project';
  entityId: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority?: Priority | null;
  dueDate?: string;
  completedAt?: string;
  assignee?: Assignee | null;
  linkedTo?: LinkedEntity | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

interface Project {
  id: string;
  name: string;
}

interface TasksTableProps {
  initialPage?: number;
  initialSearch?: string;
  projectId?: string | null;
  status?: string | null;
}

const statusConfig = {
  open: { icon: Circle, label: 'Открыта', color: 'text-zinc-500' },
  in_progress: { icon: Clock, label: 'В работе', color: 'text-blue-500' },
  completed: { icon: Check, label: 'Завершена', color: 'text-green-500' },
  cancelled: { icon: XCircle, label: 'Отменена', color: 'text-red-500' },
};

export function TasksTable({ initialPage = 1, initialSearch = '', projectId, status }: TasksTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<TasksResponse | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewContactId, setPreviewContactId] = useState<string | null>(null);

  const currentPage = parseInt(searchParams.get('page') || String(initialPage), 10);
  const currentSearch = searchParams.get('search') || '';

  const updateUrl = useCallback((params: { page?: number; search?: string }) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (params.page !== undefined) {
      if (params.page === 1) {
        newParams.delete('page');
      } else {
        newParams.set('page', String(params.page));
      }
    }

    if (params.search !== undefined) {
      if (params.search === '') {
        newParams.delete('search');
      } else {
        newParams.set('search', params.search);
      }
    }

    const queryString = newParams.toString();
    router.push(queryString ? `?${queryString}` : '/tasks', { scroll: false });
  }, [router, searchParams]);

  const fetchTasks = useCallback(async (page: number, search: string) => {
    try {
      setLoading(true);
      const body: Record<string, unknown> = { page };

      if (search) body.search = search;
      if (projectId) {
        body.entityType = 'project';
        body.entityId = projectId;
      }
      if (status) body.status = status;

      const response = await fetch('/api/tasks/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId, status]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 100 }),
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchTasks(currentPage, currentSearch);
  }, [currentPage, currentSearch, fetchTasks]);

  useEffect(() => {
    const handleTaskChange = () => {
      fetchTasks(currentPage, currentSearch);
    };
    window.addEventListener('taskCreated', handleTaskChange);
    window.addEventListener('taskUpdated', handleTaskChange);
    return () => {
      window.removeEventListener('taskCreated', handleTaskChange);
      window.removeEventListener('taskUpdated', handleTaskChange);
    };
  }, [currentPage, currentSearch, fetchTasks]);

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
  };

  const handleEditSuccess = () => {
    setEditingTask(null);
  };

  const handleEditCancel = () => {
    setEditingTask(null);
  };

  const handleDeleteClick = (task: Task) => {
    setDeletingTask(task);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${deletingTask.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setDeletingTask(null);
      fetchTasks(currentPage, currentSearch);
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingTask(null);
  };

  const handleStatusToggle = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'open' : 'completed';
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTasks(currentPage, currentSearch);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      updateUrl({ page });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const formatDateTime = (date?: string) => {
    if (!date) return '-';
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('ru-RU');
    const hours = d.getHours();
    const minutes = d.getMinutes();
    // Показываем время только если оно не 00:00
    if (hours === 0 && minutes === 0) {
      return dateStr;
    }
    const timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
      return false;
    }
    return new Date(task.dueDate) < new Date();
  };

  if (loading && !data) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8">
        <p className="text-zinc-500 dark:text-zinc-400 text-center">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (!data || data.tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8">
        <p className="text-zinc-500 dark:text-zinc-400 text-center">
          {currentSearch ? 'Задачи не найдены' : 'Нет задач'}
        </p>
      </div>
    );
  }

  const startRecord = (data.page - 1) * data.limit + 1;
  const endRecord = Math.min(data.page * data.limit, data.total);

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="w-10"></th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Название
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Статус
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Приоритет
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Привязка
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Ответственный
                </th>
                <th className="text-left px-4 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Срок
                </th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className={loading ? 'opacity-50' : ''}>
              {data.tasks.map((task) => {
                const StatusIcon = statusConfig[task.status].icon;
                const overdue = isOverdue(task);

                return (
                  <tr
                    key={task.id}
                    className="border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-3 py-1.5">
                      <button
                        onClick={() => handleStatusToggle(task)}
                        className={`p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors ${
                          task.status === 'completed' ? 'text-green-500' : 'text-zinc-400'
                        }`}
                        title={task.status === 'completed' ? 'Отметить как открытую' : 'Отметить как завершённую'}
                      >
                        {task.status === 'completed' ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-1.5">
                      <span
                        className={`text-sm font-medium ${
                          task.status === 'completed'
                            ? 'text-zinc-400 line-through'
                            : 'text-zinc-900 dark:text-zinc-50'
                        }`}
                      >
                        {task.title}
                      </span>
                    </td>
                    <td className="px-4 py-1.5">
                      <span className={`inline-flex items-center gap-1 text-sm ${statusConfig[task.status].color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig[task.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-1.5">
                      {task.priority ? (
                        <Badge
                          style={{
                            backgroundColor: task.priority.color
                              ? `${task.priority.color}20`
                              : '#71717a20',
                            color: task.priority.color || '#71717a',
                          }}
                        >
                          {task.priority.name}
                        </Badge>
                      ) : (
                        <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-1.5">
                      {task.linkedTo ? (
                        <button
                          onClick={() => {
                            if (task.linkedTo?.entityType === 'contact') {
                              setPreviewContactId(task.linkedTo.entityId);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {task.linkedTo.entityType === 'project' ? (
                            <FolderKanban className="w-3.5 h-3.5" />
                          ) : (
                            <User className="w-3.5 h-3.5" />
                          )}
                          {task.linkedTo.name}
                        </button>
                      ) : (
                        <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-1.5">
                      {task.assignee ? (
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {task.assignee.name}
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-1.5">
                      <span
                        className={`text-sm ${
                          overdue
                            ? 'text-red-500 font-medium'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {formatDateTime(task.dueDate)}
                      </span>
                    </td>
                    <td className="px-4 py-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(task)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(task)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Показано {startRecord}–{endRecord} из {data.total}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label="Предыдущая страница"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {getPageNumbers().map((page, idx) =>
                page === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-sm text-zinc-400 dark:text-zinc-500"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`min-w-[32px] px-2 py-1 text-sm rounded transition-colors ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label="Следующая страница"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Task Slide-over */}
      <SlideOver
        isOpen={!!editingTask}
        onClose={handleEditCancel}
        title="Редактирование задачи"
      >
        {editingTask && (
          <TaskForm
            task={editingTask}
            projects={projects}
            onSuccess={handleEditSuccess}
            onCancel={handleEditCancel}
          />
        )}
      </SlideOver>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTask}
        title="Удаление задачи"
        message={`Вы уверены, что хотите удалить задачу "${deletingTask?.title}"? Это действие нельзя отменить.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />

      {/* Contact Preview Panel */}
      <ContactPreviewPanel
        contactId={previewContactId}
        isOpen={!!previewContactId}
        onClose={() => setPreviewContactId(null)}
      />
    </>
  );
}
