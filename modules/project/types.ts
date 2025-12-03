export type { IProject, ProjectStatus } from './model';

// Owner reference
export interface ProjectOwner {
  id: string;
  name: string;
  email: string;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
  deadline?: Date | string;
  ownerId?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string | null;
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
  deadline?: Date | string | null;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  deadline?: Date;
  owner?: ProjectOwner | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectsListResponse {
  projects: ProjectResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectFilters {
  search?: string;
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
  ownerId?: string;
  deadlineFrom?: Date | string;
  deadlineTo?: Date | string;
  page?: number;
  limit?: number;
}
