import { defineRoutes } from '@/lib/api-docs';
import { z } from 'zod';
import {
  createContactSchema,
  updateContactSchema,
  contactFiltersSchema,
  contactResponseSchema,
  contactsListResponseSchema,
} from './validation';

export const idParamSchema = z.object({
  id: z.string().describe('ID контакта'),
});

// Примеры для документации
const contactExample = {
  id: 'clx1234567890abcdef',
  firstName: 'Иван',
  lastName: 'Петров',
  middleName: 'Сергеевич',
  email: 'ivan.petrov@example.com',
  phone: '+7 (999) 123-45-67',
  company: 'ООО "Технологии"',
  position: 'Технический директор',
  type: 'client',
  source: 'website',
  ownerId: 'clx0987654321fedcba',
  createdAt: '2024-01-15T10:30:00.000Z',
  updatedAt: '2024-01-15T10:30:00.000Z',
};

const createContactExample = {
  firstName: 'Иван',
  lastName: 'Петров',
  middleName: 'Сергеевич',
  email: 'ivan.petrov@example.com',
  phone: '+7 (999) 123-45-67',
  company: 'ООО "Технологии"',
  position: 'Технический директор',
  type: 'client',
  source: 'website',
};

const updateContactExample = {
  phone: '+7 (999) 987-65-43',
  position: 'Генеральный директор',
};

export default defineRoutes({
  'POST /api/contacts/search': {
    summary: 'Поиск контактов',
    description: 'Возвращает список контактов с пагинацией и возможностью фильтрации. Фильтры передаются в теле запроса.',
    tags: ['Контакты'],
    body: contactFiltersSchema,
    response: contactsListResponseSchema,
    responseExample: {
      data: [contactExample],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  },

  'POST /api/contacts': {
    summary: 'Создать контакт',
    description: 'Создаёт нового контакта. Владельцем автоматически становится текущий пользователь.',
    tags: ['Контакты'],
    body: createContactSchema,
    bodyExample: createContactExample,
    response: contactResponseSchema,
    responseExample: contactExample,
  },

  'GET /api/contacts/:id': {
    summary: 'Получить контакт по ID',
    description: 'Возвращает детальную информацию о контакте.',
    tags: ['Контакты'],
    params: idParamSchema,
    response: contactResponseSchema,
    responseExample: contactExample,
  },

  'PATCH /api/contacts/:id': {
    summary: 'Обновить контакт',
    description: 'Частично обновляет данные контакта. Передаются только изменяемые поля.',
    tags: ['Контакты'],
    params: idParamSchema,
    body: updateContactSchema,
    bodyExample: updateContactExample,
    response: contactResponseSchema,
    responseExample: { ...contactExample, ...updateContactExample },
  },

  'DELETE /api/contacts/:id': {
    summary: 'Удалить контакт',
    description: 'Полностью удаляет контакт из системы.',
    tags: ['Контакты'],
    params: idParamSchema,
  },
});
