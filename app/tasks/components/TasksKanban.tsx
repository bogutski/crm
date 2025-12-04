'use client';

import { useEffect, useState, useCallback } from 'react';
import { Circle, Clock, Check, XCircle, FolderKanban, User, Pencil, Trash2 } from 'lucide-react';
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

interface Project {
  id: string;
  name: string;
}

interface TasksKanbanProps {
  initialSearch?: string;
  projectId?: string | null;
  status?: string | null;
}

const statusColumns = [
  { key: 'open', label: 'Открытые', icon: Circle, color: 'text-zinc-500', bgColor: 'bg-zinc-50 dark:bg-zinc-900' },
  { key: 'in_progress', label: 'В работе', icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  { key: 'completed', label: 'Завершённые', icon: Check, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-950/30' },
  { key: 'cancelled', label: 'Отменённые', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-950/30' },
] as const;

export function TasksKanban({ initialSearch = '', projectId, status }: TasksKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewContactId, setPreviewContactId] = useState<string | null>(null);

  const fetchTasks = useCallback(async (search: string) => {
    try {
      setLoading(true);
      const body: Record<string, unknown> = { limit: 100 }; // Load tasks for kanban (API max is 100)

      if (search) body.search = search;
      if (projectId) {
        body.entityType = 'project';
        body.entityId = projectId;
      }
      // Don't filter by status in kanban - we need all statuses to populate columns

      const response = await fetch('/api/tasks/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const result = await response.json();
      setTasks(result.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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
    fetchTasks(initialSearch);
  }, [initialSearch, fetchTasks]);

  useEffect(() => {
    const handleTaskChange = () => {
      fetchTasks(initialSearch);
    };
    window.addEventListener('taskCreated', handleTaskChange);
    window.addEventListener('taskUpdated', handleTaskChange);
    return () => {
      window.removeEventListener('taskCreated', handleTaskChange);
      window.removeEventListener('taskUpdated', handleTaskChange);
    };
  }, [initialSearch, fetchTasks]);

  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTasks(initialSearch);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

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
      fetchTasks(initialSearch);
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingTask(null);
  };

  const formatDateTime = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('ru-RU');
    const hours = d.getHours();
    const minutes = d.getMinutes();
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

  // Group tasks by status
  const tasksByStatus = statusColumns.reduce((acc, column) => {
    const columnTasks = tasks.filter(task => task.status === column.key);
    acc[column.key] = columnTasks;
    return acc;
  }, {} as Record<string, Task[]>);

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
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

  return (
    <>
      <div className="flex-1 overflow-x-auto min-h-0">
        <div className="flex gap-4 h-full min-w-max pb-4">
          {statusColumns.map((column) => {
            const columnTasks = tasksByStatus[column.key] || [];
            const StatusIcon = column.icon;

            return (
              <div
                key={column.key}
                className="flex-shrink-0 w-80 flex flex-col rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                {/* Column Header */}
                <div className={`px-4 py-3 rounded-t-lg border-b border-zinc-200 dark:border-zinc-800 ${column.bgColor}`}>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-4 h-4 ${column.color}`} />
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                      {column.label}
                    </h3>
                    <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {columnTasks.length === 0 ? (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8">
                      Нет задач
                    </p>
                  ) : (
                    columnTasks.map((task) => {
                      const overdue = isOverdue(task);

                      return (
                        <div
                          key={task.id}
                          className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => handleEditClick(task)}
                        >
                          {/* Task Title */}
                          <div className="flex items-start gap-2 mb-2">
                            <h4 className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2">
                              {task.title}
                            </h4>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(task);
                                }}
                                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
                                title="Редактировать"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(task);
                                }}
                                className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
                                title="Удалить"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Task Details */}
                          <div className="space-y-2">
                            {task.priority && (
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
                            )}

                            {task.linkedTo && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (task.linkedTo?.entityType === 'contact') {
                                    setPreviewContactId(task.linkedTo.entityId);
                                  }
                                }}
                                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {task.linkedTo.entityType === 'project' ? (
                                  <FolderKanban className="w-3 h-3" />
                                ) : (
                                  <User className="w-3 h-3" />
                                )}
                                {task.linkedTo.name}
                              </button>
                            )}

                            {task.assignee && (
                              <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                                <User className="w-3 h-3" />
                                {task.assignee.name}
                              </div>
                            )}

                            {task.dueDate && (
                              <div
                                className={`text-xs ${
                                  overdue
                                    ? 'text-red-500 font-medium'
                                    : 'text-zinc-600 dark:text-zinc-400'
                                }`}
                              >
                                {formatDateTime(task.dueDate)}
                              </div>
                            )}
                          </div>

                          {/* Status change buttons */}
                          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-700 flex gap-1">
                            {statusColumns
                              .filter(col => col.key !== task.status)
                              .map((col) => {
                                const Icon = col.icon;
                                return (
                                  <button
                                    key={col.key}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(task, col.key as Task['status']);
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors ${col.color}`}
                                    title={`Переместить в "${col.label}"`}
                                  >
                                    <Icon className="w-3 h-3" />
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
