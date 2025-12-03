import { defineRoutes } from '@/lib/api-docs';
import { z } from 'zod';
import {
  createUserSchema,
  updateUserSchema,
  userFiltersSchema,
  userResponseSchema,
  usersListResponseSchema,
} from './validation';

export const idParamSchema = z.object({
  id: z.string().describe('ID пользователя'),
});

// Примеры для документации
const userExample = {
  id: 'clx1234567890abcdef',
  email: 'admin@example.com',
  name: 'Администратор Системы',
  role: 'admin',
  isActive: true,
  createdAt: '2024-01-10T08:00:00.000Z',
  updatedAt: '2024-01-10T08:00:00.000Z',
};

const createUserExample = {
  email: 'manager@example.com',
  name: 'Менеджер Продаж',
  password: 'securePassword123',
  role: 'manager',
};

const updateUserExample = {
  name: 'Старший менеджер',
  role: 'admin',
};

export default defineRoutes({
  'POST /api/users/search': {
    summary: 'Поиск пользователей',
    description: 'Возвращает список пользователей с пагинацией. Фильтры передаются в теле запроса. Доступно только администраторам.',
    tags: ['Пользователи'],
    body: userFiltersSchema,
    response: usersListResponseSchema,
    responseExample: {
      data: [userExample],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  },

  'POST /api/users': {
    summary: 'Создать пользователя',
    description: 'Создаёт нового пользователя. Доступно только администраторам.',
    tags: ['Пользователи'],
    body: createUserSchema,
    bodyExample: createUserExample,
    response: userResponseSchema,
    responseExample: { ...userExample, email: 'manager@example.com', name: 'Менеджер Продаж', role: 'manager' },
  },

  'GET /api/users/:id': {
    summary: 'Получить пользователя по ID',
    description: 'Возвращает информацию о пользователе.',
    tags: ['Пользователи'],
    params: idParamSchema,
    response: userResponseSchema,
    responseExample: userExample,
  },

  'PATCH /api/users/:id': {
    summary: 'Обновить пользователя',
    description: 'Обновляет данные пользователя. Доступно только администраторам.',
    tags: ['Пользователи'],
    params: idParamSchema,
    body: updateUserSchema,
    bodyExample: updateUserExample,
    response: userResponseSchema,
    responseExample: { ...userExample, ...updateUserExample },
  },

  'DELETE /api/users/:id': {
    summary: 'Удалить пользователя',
    description: 'Удаляет пользователя из системы. Доступно только администраторам.',
    tags: ['Пользователи'],
    params: idParamSchema,
  },
});
