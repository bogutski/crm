'use client';

import { Pencil, Trash2, FolderKanban, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { KanbanItem } from '../types';

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

export interface Task extends KanbanItem {
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

export interface TaskCardProps {
  task: Task;
  onEditClick: (task: Task) => void;
  onDeleteClick: (task: Task) => void;
  onLinkedEntityClick?: (entityType: string, entityId: string) => void;
}

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

export function TaskCard({ task, onEditClick, onDeleteClick, onLinkedEntityClick }: TaskCardProps) {
  const overdue = isOverdue(task);

  return (
    <div
      className="group bg-white dark:bg-zinc-900 rounded-lg shadow-sm hover:shadow-md border-0 hover:ring-2 hover:ring-blue-400/50 cursor-pointer transition-all"
      onClick={() => onEditClick(task)}
    >
      <div className="p-2.5">
        {/* Task Title */}
        <div className="flex items-start gap-2 mb-2">
          <h4 className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100 line-clamp-2">
            {task.title}
          </h4>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(task);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              title="Редактировать"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(task);
              }}
              className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              title="Удалить"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Task Details */}
        <div className="flex flex-wrap items-center gap-2">
          {task.priority && (
            <Badge color={task.priority.color || '#71717a'}>
              {task.priority.name}
            </Badge>
          )}

          {task.linkedTo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onLinkedEntityClick) {
                  onLinkedEntityClick(task.linkedTo!.entityType, task.linkedTo!.entityId);
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
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div
            className={`text-xs mt-2 ${
              overdue
                ? 'text-red-500 font-medium'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {formatDateTime(task.dueDate)}
          </div>
        )}

        {/* Assignee - bottom with border */}
        {task.assignee && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
              {task.assignee.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
              {task.assignee.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
