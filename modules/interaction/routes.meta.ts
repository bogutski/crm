import { defineRoutes } from '@/lib/api-docs';
import { z } from 'zod';
import {
  createInteractionSchema,
  updateInteractionSchema,
  interactionFiltersSchema,
  interactionResponseSchema,
  interactionListResponseSchema,
} from './validation';

export const idParamSchema = z.object({
  id: z.string().describe('ID взаимодействия'),
});

// Примеры для документации
const interactionExample = {
  id: 'clx1234567890abcdef',
  channelId: 'clx_channel_001',
  contactId: 'clx_contact_001',
  opportunityId: 'clx_opportunity_001',
  direction: 'inbound',
  status: 'delivered',
  subject: 'Запрос информации',
  content: 'Здравствуйте! Интересует ваш продукт.',
  duration: null,
  recordingUrl: null,
  metadata: {},
  createdAt: '2024-01-15T10:30:00.000Z',
  createdBy: 'clx_user_001',
  channel: {
    id: 'clx_channel_001',
    code: 'email',
    name: 'Email',
    icon: 'mail',
    color: '#3b82f6',
  },
  contact: {
    id: 'clx_contact_001',
    name: 'Иван Петров',
  },
};

const createInteractionExample = {
  channelId: 'clx_channel_001',
  contactId: 'clx_contact_001',
  direction: 'inbound',
  status: 'delivered',
  content: 'Здравствуйте! Интересует ваш продукт.',
  metadata: {
    source: 'webhook',
    externalId: 'ext_12345',
  },
};

const searchFiltersExample = {
  contactId: 'clx_contact_001',
  channelId: 'clx_channel_001',
  direction: 'inbound',
  limit: 50,
  offset: 0,
};

export default defineRoutes({
  'POST /api/interactions/search': {
    summary: 'Поиск взаимодействий',
    description: `
Возвращает список взаимодействий с пагинацией и фильтрацией.

**Фильтры:**
- \`contactId\` — фильтр по контакту
- \`channelId\` — фильтр по каналу
- \`opportunityId\` — фильтр по сделке
- \`direction\` — направление (inbound/outbound)
- \`status\` — статус (pending/sent/delivered/read/failed)
- \`dateFrom\`, \`dateTo\` — диапазон дат

**Пагинация:**
- \`limit\` — количество записей (по умолчанию 50, макс. 100)
- \`offset\` — смещение
    `.trim(),
    tags: ['Взаимодействия'],
    body: interactionFiltersSchema,
    bodyExample: searchFiltersExample,
    response: interactionListResponseSchema,
    responseExample: {
      interactions: [interactionExample],
      total: 1,
    },
  },

  'POST /api/interactions': {
    summary: 'Создать взаимодействие',
    description: `
Создаёт новое взаимодействие (сообщение, звонок и т.д.).

**Используется для:**
- Входящих webhook от внешних систем (Telegram, WhatsApp и т.д.)
- Отправки исходящих сообщений из CRM

**Обязательные поля:**
- \`channelId\` — ID канала коммуникации
- \`contactId\` — ID контакта
- \`direction\` — направление (inbound для входящих, outbound для исходящих)
- \`content\` — текст сообщения

**Опциональные поля:**
- \`opportunityId\` — привязка к сделке
- \`status\` — статус доставки (по умолчанию pending)
- \`subject\` — тема (для email)
- \`duration\` — длительность в секундах (для звонков)
- \`recordingUrl\` — URL записи (для звонков)
- \`metadata\` — дополнительные данные
    `.trim(),
    tags: ['Взаимодействия'],
    body: createInteractionSchema,
    bodyExample: createInteractionExample,
    response: interactionResponseSchema,
    responseExample: interactionExample,
  },

  'GET /api/interactions/:id': {
    summary: 'Получить взаимодействие по ID',
    description: 'Возвращает детальную информацию о взаимодействии, включая данные канала и контакта.',
    tags: ['Взаимодействия'],
    params: idParamSchema,
    response: interactionResponseSchema,
    responseExample: interactionExample,
  },

  'PATCH /api/interactions/:id': {
    summary: 'Обновить взаимодействие',
    description: `
Частично обновляет данные взаимодействия.

**Типичные сценарии:**
- Обновление статуса доставки (pending → sent → delivered → read)
- Добавление записи звонка после его завершения
- Обновление метаданных
    `.trim(),
    tags: ['Взаимодействия'],
    params: idParamSchema,
    body: updateInteractionSchema,
    bodyExample: { status: 'read' },
    response: interactionResponseSchema,
    responseExample: { ...interactionExample, status: 'read' },
  },

  'DELETE /api/interactions/:id': {
    summary: 'Удалить взаимодействие',
    description: 'Полностью удаляет взаимодействие из системы.',
    tags: ['Взаимодействия'],
    params: idParamSchema,
  },
});
