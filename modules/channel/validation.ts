import { z } from 'zod';

// === Input schemas (request body) ===

export const createChannelSchema = z.object({
  code: z.string()
    .min(1, 'Код обязателен')
    .max(50, 'Код не должен превышать 50 символов')
    .regex(/^[a-z][a-z0-9_]*$/, 'Код должен содержать только латинские буквы в нижнем регистре, цифры и _')
    .describe('Уникальный код канала'),
  name: z.string()
    .min(1, 'Название обязательно')
    .max(100, 'Название не должно превышать 100 символов')
    .describe('Название канала'),
  icon: z.string()
    .max(50, 'Название иконки не должно превышать 50 символов')
    .optional()
    .default('message-circle')
    .describe('Название иконки (Lucide)'),
  color: z.string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Цвет должен быть в формате HEX (#RRGGBB)')
    .optional()
    .default('#6b7280')
    .describe('Цвет в формате HEX'),
  isActive: z.boolean()
    .optional()
    .default(true)
    .describe('Активен ли канал'),
}).describe('Данные для создания канала');

export const updateChannelSchema = z.object({
  name: z.string()
    .min(1)
    .max(100)
    .optional()
    .describe('Название канала'),
  icon: z.string()
    .max(50)
    .optional()
    .describe('Название иконки'),
  color: z.string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Цвет должен быть в формате HEX (#RRGGBB)')
    .optional()
    .describe('Цвет в формате HEX'),
  isActive: z.boolean()
    .optional()
    .describe('Активен ли канал'),
}).describe('Данные для обновления канала');

// === Response schemas ===

export const channelResponseSchema = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  code: z.string().describe('Код канала'),
  name: z.string().describe('Название'),
  icon: z.string().describe('Иконка'),
  color: z.string().describe('Цвет'),
  isActive: z.boolean().describe('Активен ли канал'),
  createdAt: z.coerce.date().describe('Дата создания'),
  updatedAt: z.coerce.date().describe('Дата обновления'),
}).describe('Канал коммуникации');

export const channelListResponseSchema = z.object({
  channels: z.array(channelResponseSchema).describe('Список каналов'),
  total: z.number().describe('Общее количество'),
}).describe('Список каналов');

// === Input Types ===

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
