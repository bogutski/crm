import { defineRoutes } from '@/lib/api-docs';
import {
  createApiTokenSchema,
  updateApiTokenSchema,
  apiTokenFiltersSchema,
  apiTokenResponseSchema,
  apiTokenCreatedResponseSchema,
  apiTokensListResponseSchema,
} from './validation';

export default defineRoutes({
  'POST /api/api-tokens/search': {
    summary: 'Поиск API токенов',
    description: 'Возвращает список API токенов с пагинацией и фильтрацией',
    tags: ['API Токены'],
    body: apiTokenFiltersSchema,
    response: apiTokensListResponseSchema,
    responseExample: {
      tokens: [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Production API',
          tokenPrefix: 'crm_sk_a1b2...',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    },
  },

  'POST /api/api-tokens': {
    summary: 'Создать API токен',
    description: 'Создаёт новый API токен. Полный токен возвращается только при создании!',
    tags: ['API Токены'],
    body: createApiTokenSchema,
    response: apiTokenCreatedResponseSchema,
    responseExample: {
      id: '507f1f77bcf86cd799439011',
      name: 'Production API',
      tokenPrefix: 'crm_sk_a1b2...',
      token: 'crm_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
    },
  },

  'GET /api/api-tokens/:id': {
    summary: 'Получить API токен по ID',
    description: 'Возвращает информацию об API токене (без полного значения токена)',
    tags: ['API Токены'],
    response: apiTokenResponseSchema,
    responseExample: {
      id: '507f1f77bcf86cd799439011',
      name: 'Production API',
      tokenPrefix: 'crm_sk_a1b2...',
      lastUsedAt: '2024-01-20T15:45:00Z',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
    },
  },

  'PATCH /api/api-tokens/:id': {
    summary: 'Обновить API токен',
    description: 'Обновляет название API токена',
    tags: ['API Токены'],
    body: updateApiTokenSchema,
    response: apiTokenResponseSchema,
  },

  'DELETE /api/api-tokens/:id': {
    summary: 'Удалить API токен',
    description: 'Удаляет API токен. После удаления токен перестаёт работать.',
    tags: ['API Токены'],
  },
});
