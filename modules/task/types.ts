export type { ITask, ILinkedEntity, TaskStatus, LinkedEntityType } from './model';

// Priority from dictionary
export interface TaskPriority {
  id: string;
  name: string;
  color?: string;
}

// Assignee reference
export interface TaskAssignee {
  id: string;
  name: string;
  email: string;
}

// Linked entity response (contact or project)
export interface LinkedEntityResponse {
  entityType: 'contact' | 'project';
  entityId: string;
  name: string; // Name of the linked contact or project
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priorityId?: string;
  dueDate?: Date | string;
  assigneeId?: string;
  linkedTo?: {
    entityType: 'contact' | 'project';
    entityId: string;
  };
  ownerId?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string | null;
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priorityId?: string | null;
  dueDate?: Date | string | null;
  assigneeId?: string | null;
  linkedTo?: {
    entityType: 'contact' | 'project';
    entityId: string;
  } | null;
}

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority?: TaskPriority | null;
  dueDate?: Date;
  completedAt?: Date;
  assignee?: TaskAssignee | null;
  linkedTo?: LinkedEntityResponse | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TasksListResponse {
  tasks: TaskResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface TaskFilters {
  search?: string;
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priorityId?: string;
  assigneeId?: string;
  ownerId?: string;
  entityType?: 'contact' | 'project';
  entityId?: string;
  dueDateFrom?: Date | string;
  dueDateTo?: Date | string;
  overdue?: boolean;
  page?: number;
  limit?: number;
}
