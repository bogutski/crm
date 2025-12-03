import { z } from 'zod';

// === Enums ===

export const userRoleSchema = z.enum(['admin', 'manager', 'user'])
  .describe('Роль пользователя: admin - администратор, manager - менеджер, user - пользователь');

// === Input schemas (request body) ===

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format').describe('Email пользователя'),
  name: z.string().min(2, 'Name must be at least 2 characters').describe('Имя пользователя'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().describe('Пароль (мин. 6 символов)'),
  roles: z.array(userRoleSchema).optional().describe('Список ролей'),
  googleId: z.string().optional().describe('Google ID для OAuth'),
  image: z.string().url().optional().describe('URL аватара'),
}).describe('Данные для создания пользователя');

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional().describe('Имя пользователя'),
  email: z.string().email('Invalid email format').optional().describe('Email пользователя'),
  roles: z.array(userRoleSchema).optional().describe('Список ролей'),
  isActive: z.boolean().optional().describe('Активен ли пользователь'),
  image: z.string().url().optional().describe('URL аватара'),
}).describe('Данные для обновления пользователя');

export const userFiltersSchema = z.object({
  search: z.string().optional().describe('Поиск по имени и email'),
  role: userRoleSchema.optional().describe('Фильтр по роли'),
  isActive: z.coerce.boolean().optional().describe('Фильтр по активности'),
  page: z.coerce.number().int().positive().optional().default(1).describe('Номер страницы'),
  limit: z.coerce.number().int().positive().max(100).optional().default(20).describe('Количество на странице (макс. 100)'),
}).describe('Фильтры для списка пользователей');

// === Response schemas ===

export const userResponseSchema = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  email: z.string().describe('Email'),
  name: z.string().describe('Имя'),
  image: z.string().optional().describe('URL аватара'),
  roles: z.array(userRoleSchema).describe('Список ролей'),
  isActive: z.boolean().describe('Активен ли пользователь'),
  lastLoginAt: z.coerce.date().optional().describe('Дата последнего входа'),
  createdAt: z.coerce.date().describe('Дата создания'),
  updatedAt: z.coerce.date().describe('Дата обновления'),
}).describe('Пользователь');

export const usersListResponseSchema = z.object({
  users: z.array(userResponseSchema).describe('Список пользователей'),
  total: z.number().describe('Общее количество'),
  page: z.number().describe('Текущая страница'),
  limit: z.number().describe('Размер страницы'),
}).describe('Список пользователей с пагинацией');

// === Input Types (для валидации запросов) ===

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserFiltersInput = z.infer<typeof userFiltersSchema>;
