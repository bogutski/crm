import { IUser, UserRole } from './model';

export type { IUser, UserRole };

export interface CreateUserDTO {
  email: string;
  name: string;
  password?: string;
  roles?: UserRole[];
  googleId?: string;
  image?: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  roles?: UserRole[];
  isActive?: boolean;
  image?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  image?: string;
  roles: UserRole[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsersListResponse {
  users: UserResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
