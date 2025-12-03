import { defineRoutes } from '@/lib/api-docs';
import { z } from 'zod';
import {
  createChannelSchema,
  updateChannelSchema,
  channelResponseSchema,
  channelListResponseSchema,
} from './validation';

export const idParamSchema = z.object({
  id: z.string().describe('ID канала'),
});

// Примеры для документации
const channelExample = {
  id: 'clx_channel_001',
  code: 'telegram',
  name: 'Telegram',
  icon: 'send',
  color: '#0088cc',
  isActive: true,
  createdAt: '2024-01-15T10:30:00.000Z',
  updatedAt: '2024-01-15T10:30:00.000Z',
};

const createChannelExample = {
  code: 'telegram',
  name: 'Telegram',
  icon: 'send',
  color: '#0088cc',
  isActive: true,
};

const updateChannelExample = {
  name: 'Telegram Bot',
  color: '#229ED9',
};

export default defineRoutes({
  'POST /api/channels/search': {
    summary: 'Получить список каналов',
    description: `
Возвращает список всех каналов коммуникации.

**Каналы коммуникации** — это способы связи с контактами:
- Email
- Телефон (звонки)
- SMS
- Мессенджеры (Telegram, WhatsApp, Viber)
- Социальные сети (Facebook, Instagram, LinkedIn)
- Веб-чат
- Видеоконференции (Zoom, Google Meet)

Каждый канал имеет:
- \`code\` — уникальный код для идентификации
- \`icon\` — название иконки из набора Lucide
- \`color\` — цвет для отображения в интерфейсе
    `.trim(),
    tags: ['Каналы'],
    body: z.object({}).optional().describe('Фильтры (пока не используются)'),
    response: channelListResponseSchema,
    responseExample: {
      channels: [
        channelExample,
        { ...channelExample, id: 'clx_channel_002', code: 'email', name: 'Email', icon: 'mail', color: '#3b82f6' },
        { ...channelExample, id: 'clx_channel_003', code: 'phone', name: 'Телефон', icon: 'phone', color: '#22c55e' },
      ],
      total: 3,
    },
  },

  'POST /api/channels': {
    summary: 'Создать канал',
    description: `
Создаёт новый канал коммуникации.

**Правила для кода:**
- Только латинские буквы в нижнем регистре, цифры и символ \`_\`
- Должен начинаться с буквы
- Уникальный в системе

**Иконки:**
Используются иконки из библиотеки [Lucide](https://lucide.dev/icons/).
Популярные: mail, phone, send, message-circle, video, globe.
    `.trim(),
    tags: ['Каналы'],
    body: createChannelSchema,
    bodyExample: createChannelExample,
    response: channelResponseSchema,
    responseExample: channelExample,
  },

  'GET /api/channels/:id': {
    summary: 'Получить канал по ID',
    description: 'Возвращает информацию о канале коммуникации.',
    tags: ['Каналы'],
    params: idParamSchema,
    response: channelResponseSchema,
    responseExample: channelExample,
  },

  'PATCH /api/channels/:id': {
    summary: 'Обновить канал',
    description: 'Частично обновляет данные канала. Код канала изменить нельзя.',
    tags: ['Каналы'],
    params: idParamSchema,
    body: updateChannelSchema,
    bodyExample: updateChannelExample,
    response: channelResponseSchema,
    responseExample: { ...channelExample, ...updateChannelExample },
  },

  'DELETE /api/channels/:id': {
    summary: 'Удалить канал',
    description: `
Удаляет канал коммуникации.

**Внимание:** При удалении канала все связанные взаимодействия сохраняются,
но будут отображаться без информации о канале.
    `.trim(),
    tags: ['Каналы'],
    params: idParamSchema,
  },
});
