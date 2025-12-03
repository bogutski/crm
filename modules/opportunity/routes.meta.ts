import { defineRoutes } from '@/lib/api-docs';
import { z } from 'zod';
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  opportunityFiltersSchema,
  opportunityResponseSchema,
  opportunitiesListResponseSchema,
} from './validation';

export const idParamSchema = z.object({
  id: z.string().describe('ID сделки'),
});

// Примеры для документации
const opportunityExample = {
  id: 'clx1234567890abcdef',
  name: 'Внедрение CRM системы',
  description: 'Проект по внедрению CRM для автоматизации продаж',
  amount: 1500000,
  closingDate: '2024-03-15',
  archived: false,
  externalId: 'EXT-001',
  utm: {
    source: 'google',
    medium: 'cpc',
    campaign: 'spring_sale',
  },
  contact: {
    id: 'clx0987654321fedcba',
    name: 'Иван Петров',
  },
  owner: {
    id: 'clxowner123456789ab',
    name: 'Менеджер',
    email: 'manager@example.com',
  },
  priority: {
    id: 'clxpriority123',
    name: 'Высокий',
    color: '#f97316',
  },
  createdAt: '2024-01-20T14:00:00.000Z',
  updatedAt: '2024-02-01T09:30:00.000Z',
};

const createOpportunityExample = {
  name: 'Внедрение CRM системы',
  description: 'Проект по внедрению CRM для автоматизации продаж',
  amount: 1500000,
  closingDate: '2024-03-15',
  contactId: 'clx0987654321fedcba',
  priorityId: 'clxpriority123',
};

const updateOpportunityExample = {
  name: 'Обновлённое название',
  amount: 1800000,
};

export default defineRoutes({
  'POST /api/opportunities/search': {
    summary: 'Поиск сделок',
    description: 'Возвращает список сделок с пагинацией и фильтрацией. Фильтры передаются в теле запроса.',
    tags: ['Сделки'],
    body: opportunityFiltersSchema,
    response: opportunitiesListResponseSchema,
    responseExample: {
      opportunities: [opportunityExample],
      total: 1,
      page: 1,
      limit: 20,
    },
  },

  'POST /api/opportunities': {
    summary: 'Создать сделку',
    description: 'Создаёт новую сделку. Владельцем автоматически становится текущий пользователь.',
    tags: ['Сделки'],
    body: createOpportunitySchema,
    bodyExample: createOpportunityExample,
    response: opportunityResponseSchema,
    responseExample: opportunityExample,
  },

  'GET /api/opportunities/:id': {
    summary: 'Получить сделку по ID',
    description: 'Возвращает детальную информацию о сделке.',
    tags: ['Сделки'],
    params: idParamSchema,
    response: opportunityResponseSchema,
    responseExample: opportunityExample,
  },

  'PATCH /api/opportunities/:id': {
    summary: 'Обновить сделку',
    description: 'Частично обновляет данные сделки.',
    tags: ['Сделки'],
    params: idParamSchema,
    body: updateOpportunitySchema,
    bodyExample: updateOpportunityExample,
    response: opportunityResponseSchema,
    responseExample: { ...opportunityExample, ...updateOpportunityExample },
  },

  'DELETE /api/opportunities/:id': {
    summary: 'Удалить сделку',
    description: 'Удаляет сделку из системы.',
    tags: ['Сделки'],
    params: idParamSchema,
  },
});
