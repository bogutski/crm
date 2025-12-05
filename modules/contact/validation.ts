import { z } from 'zod';

// === Enums ===

export const phoneTypeSchema = z.enum(['MOBILE', 'FIXED_LINE', 'UNKNOWN'])
  .describe('Тип телефона');

// === Sub-schemas ===

export const emailSchema = z.object({
  address: z.string().email('Invalid email format').describe('Email адрес'),
  isVerified: z.boolean().optional().default(false).describe('Email подтверждён'),
  isSubscribed: z.boolean().optional().default(true).describe('Подписан на рассылку'),
  unsubscribedAt: z.coerce.date().optional().describe('Дата отписки'),
  bouncedAt: z.coerce.date().optional().describe('Дата bounce'),
  lastEmailedAt: z.coerce.date().optional().describe('Дата последнего письма'),
}).describe('Email контакта');

export const phoneSchema = z.object({
  e164: z.string().min(1, 'Phone number is required').describe('Номер в формате E.164 (+71234567890)'),
  international: z.string().min(1, 'International format is required').describe('Международный формат (+7 123 456-78-90)'),
  country: z.string().length(2, 'Country code must be 2 characters').describe('Код страны ISO 3166-1 alpha-2'),
  type: phoneTypeSchema.optional().default('UNKNOWN'),
  isPrimary: z.boolean().optional().default(false).describe('Основной номер'),
  isVerified: z.boolean().optional().default(false).describe('Номер подтверждён'),
  isSubscribed: z.boolean().optional().default(true).describe('Подписан на SMS'),
  unsubscribedAt: z.coerce.date().optional().describe('Дата отписки от SMS'),
  lastSmsAt: z.coerce.date().optional().describe('Дата последнего SMS'),
}).describe('Телефон контакта');

// === Input schemas (request body) ===

export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required').describe('Имя контакта'),
  emails: z.array(emailSchema).optional().default([]).describe('Список email адресов'),
  phones: z.array(phoneSchema).optional().default([]).describe('Список телефонов'),
  company: z.string().optional().describe('Название компании'),
  position: z.string().optional().describe('Должность'),
  notes: z.string().optional().describe('Заметки'),
  contactType: z.string().optional().describe('ID типа контакта из словаря'),
  source: z.string().optional().describe('ID источника из словаря'),
  ownerId: z.string().optional().describe('ID владельца контакта'),
}).describe('Данные для создания контакта');

export const updateContactSchema = z.object({
  name: z.string().min(1, 'Name is required').optional().describe('Имя контакта'),
  emails: z.array(emailSchema).optional().describe('Список email адресов'),
  phones: z.array(phoneSchema).optional().describe('Список телефонов'),
  company: z.string().optional().describe('Название компании'),
  position: z.string().optional().describe('Должность'),
  notes: z.string().optional().describe('Заметки'),
  contactType: z.string().optional().nullable().describe('ID типа контакта из словаря'),
  source: z.string().optional().nullable().describe('ID источника из словаря'),
  ownerId: z.string().optional().nullable().describe('ID владельца контакта'),
}).describe('Данные для обновления контакта');

export const contactFiltersSchema = z.object({
  search: z.string().optional().describe('Поиск по имени, email, телефону, компании'),
  ownerId: z.string().optional().describe('ID владельца контакта'),
  contactType: z.string().optional().describe('ID типа контакта'),
  source: z.string().optional().describe('ID источника'),
  page: z.coerce.number().int().positive().optional().default(1).describe('Номер страницы'),
  limit: z.coerce.number().int().positive().max(100).optional().default(30).describe('Количество на странице (макс. 100)'),
}).describe('Фильтры для списка контактов');

// === Response schemas ===

export const contactTypeResponseSchema = z.object({
  id: z.string().describe('ID типа контакта'),
  name: z.string().describe('Название типа'),
  color: z.string().optional().describe('Цвет для отображения'),
}).describe('Тип контакта');

export const contactResponseSchema = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  name: z.string().describe('Имя контакта'),
  emails: z.array(emailSchema).describe('Список email адресов'),
  phones: z.array(phoneSchema).describe('Список телефонов'),
  company: z.string().optional().describe('Название компании'),
  position: z.string().optional().describe('Должность'),
  notes: z.string().optional().describe('Заметки'),
  contactType: contactTypeResponseSchema.nullable().optional().describe('Тип контакта'),
  source: z.string().optional().describe('Источник'),
  ownerId: z.string().describe('ID владельца'),
  createdAt: z.coerce.date().describe('Дата создания'),
  updatedAt: z.coerce.date().describe('Дата обновления'),
}).describe('Контакт');

export const contactsListResponseSchema = z.object({
  contacts: z.array(contactResponseSchema).describe('Список контактов'),
  total: z.number().describe('Общее количество'),
  page: z.number().describe('Текущая страница'),
  limit: z.number().describe('Размер страницы'),
}).describe('Список контактов с пагинацией');

// === Input Types (для валидации запросов) ===

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactFiltersInput = z.infer<typeof contactFiltersSchema>;

// === Схемы для форм (упрощённые) ===

export const emailFormSchema = z.object({
  address: z.string(),
});

export const phoneFormSchema = z.object({
  number: z.string(),
  isPrimary: z.boolean(),
});

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Имя обязательно'),
  emails: z.array(emailFormSchema),
  phones: z.array(phoneFormSchema),
  company: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
  contactType: z.string().optional(),
  source: z.string().optional(),
  ownerId: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
