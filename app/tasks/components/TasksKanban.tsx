'use client';

import { useState, useCallback, useEffect } from 'react';
import { SlideOver } from '@/app/components/SlideOver';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { TaskForm } from './TaskForm';
import { ContactPreviewPanel } from '@/app/contacts/components/ContactPreviewPanel';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TaskCard, type Task } from '@/components/kanban/cards/TaskCard';
import type { KanbanColumn, KanbanFetchResult } from '@/components/kanban/types';

interface Project {
  id: string;
  name: string;
}

interface TasksKanbanProps {
  initialSearch?: string;
  projectId?: string | null;
  assigneeId?: string;
  priorityId?: string;
}

const statusColumns: KanbanColumn[] = [
  { id: 'open', name: 'Открытые', color: '#71717a' },
  { id: 'in_progress', name: 'В работе', color: '#3b82f6' },
  { id: 'completed', name: 'Завершённые', color: '#22c55e' },
  { id: 'cancelled', name: 'Отменённые', color: '#ef4444' },
];

const PAGE_SIZE = 20;

export function TasksKanban({ initialSearch = '', projectId, assigneeId, priorityId }: TasksKanbanProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewContactId, setPreviewContactId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Fetch tasks for a specific status column
  const fetchItems = useCallback(async (
    statusId: string,
    page: number,
    pageSize: number
  ): Promise<KanbanFetchResult<Task>> => {
    try {
      const body: Record<string, unknown> = {
        status: statusId,
        page,
        limit: pageSize,
      };

      if (initialSearch) body.search = initialSearch;
      if (projectId) {
        body.entityType = 'project';
        body.entityId = projectId;
      }
      if (assigneeId) body.assigneeId = assigneeId;
      if (priorityId) body.priorityId = priorityId;

      const response = await fetch('/api/tasks/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          items: result.tasks || [],
          total: result.total || 0,
        };
      }
    } catch (error) {
      console.error(`Error fetching tasks for status ${statusId}:`, error);
    }

    return { items: [], total: 0 };
  }, [initialSearch, projectId, assigneeId, priorityId]);

  // Get column id from task
  const getItemColumnId = useCallback((task: Task) => {
    return task.status;
  }, []);

  // Handle task move between statuses
  const handleItemMove = useCallback(async (
    task: Task,
    _fromColumnId: string,
    toColumnId: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toColumnId }),
      });

      if (response.ok) {
        window.dispatchEvent(new CustomEvent('taskUpdated'));
        return true;
      }
    } catch (error) {
      console.error('Error moving task:', error);
    }
    return false;
  }, []);

  // Handle edit click
  const handleEditClick = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  // Handle delete click
  const handleDeleteClick = useCallback((task: Task) => {
    setDeletingTask(task);
  }, []);

  // Handle linked entity click
  const handleLinkedEntityClick = useCallback((entityType: string, entityId: string) => {
    if (entityType === 'contact') {
      setPreviewContactId(entityId);
    }
  }, []);

  // Render task card
  const renderCard = useCallback((task: Task) => {
    return (
      <TaskCard
        task={task}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onLinkedEntityClick={handleLinkedEntityClick}
      />
    );
  }, [handleEditClick, handleDeleteClick, handleLinkedEntityClick]);

  const handleEditSuccess = () => {
    setEditingTask(null);
    setRefreshKey(k => k + 1);
  };

  const handleEditCancel = () => {
    setEditingTask(null);
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
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingTask(null);
  };

  return (
    <>
      <KanbanBoard
        key={`tasks-${initialSearch}-${projectId}-${assigneeId}-${priorityId}-${refreshKey}`}
        columns={statusColumns}
        fetchItems={fetchItems}
        getItemColumnId={getItemColumnId}
        onItemMove={handleItemMove}
        renderCard={renderCard}
        refreshEvents={['taskCreated', 'taskUpdated']}
        pageSize={PAGE_SIZE}
        emptyText="Нет задач"
      />

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
