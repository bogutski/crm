import { defineRoutes } from '@/lib/api-docs';
import { z } from 'zod';
import {
  createDictionarySchema,
  updateDictionarySchema,
  createDictionaryItemSchema,
  updateDictionaryItemSchema,
  dictionaryResponseSchema,
  dictionaryListResponseSchema,
  dictionaryItemResponseSchema,
  dictionaryItemsListResponseSchema,
} from './validation';

export const codeParamSchema = z.object({
  code: z.string().describe('Код словаря'),
});

export const itemIdParamSchema = z.object({
  code: z.string().describe('Код словаря'),
  id: z.string().describe('ID элемента'),
});

// Примеры для документации
const dictionaryExample = {
  id: 'clx1234567890abcdef',
  code: 'contact_types',
  name: 'Типы контактов',
  description: 'Словарь типов контактов для классификации',
  isSystem: false,
  isHierarchical: false,
  createdAt: '2024-01-05T12:00:00.000Z',
  updatedAt: '2024-01-05T12:00:00.000Z',
  _count: { items: 5 },
};

const createDictionaryExample = {
  code: 'industries',
  name: 'Отрасли',
  description: 'Отрасли экономики для классификации клиентов',
  isHierarchical: true,
};

const updateDictionaryExample = {
  name: 'Отрасли экономики',
  description: 'Обновлённое описание отраслей',
};

const dictionaryItemExample = {
  id: 'clxitem12345678abcd',
  code: 'client',
  name: 'Клиент',
  description: 'Действующий клиент компании',
  sortOrder: 1,
  isActive: true,
  parentId: null,
  dictionaryCode: 'contact_types',
  children: [],
};

const createItemExample = {
  code: 'partner',
  name: 'Партнёр',
  description: 'Партнёр компании',
  sortOrder: 2,
  isActive: true,
};

const updateItemExample = {
  name: 'Стратегический партнёр',
  sortOrder: 1,
};

export default defineRoutes({
  // === Словари ===

  'POST /api/dictionaries/search': {
    summary: 'Поиск словарей',
    description: 'Возвращает список всех словарей с количеством элементов в каждом.',
    tags: ['Словари'],
    response: dictionaryListResponseSchema,
    responseExample: [dictionaryExample],
  },

  'POST /api/dictionaries': {
    summary: 'Создать словарь',
    description: 'Создаёт новый словарь с указанными полями.',
    tags: ['Словари'],
    body: createDictionarySchema,
    bodyExample: createDictionaryExample,
    response: dictionaryResponseSchema,
    responseExample: { ...dictionaryExample, ...createDictionaryExample, _count: { items: 0 } },
  },

  'GET /api/dictionaries/:code': {
    summary: 'Получить словарь по коду',
    description: 'Возвращает информацию о словаре.',
    tags: ['Словари'],
    params: codeParamSchema,
    response: dictionaryResponseSchema,
    responseExample: dictionaryExample,
  },

  'PATCH /api/dictionaries/:code': {
    summary: 'Обновить словарь',
    description: 'Обновляет настройки словаря.',
    tags: ['Словари'],
    params: codeParamSchema,
    body: updateDictionarySchema,
    bodyExample: updateDictionaryExample,
    response: dictionaryResponseSchema,
    responseExample: { ...dictionaryExample, ...updateDictionaryExample },
  },

  'DELETE /api/dictionaries/:code': {
    summary: 'Удалить словарь',
    description: 'Удаляет словарь вместе со всеми его элементами.',
    tags: ['Словари'],
    params: codeParamSchema,
  },

  // === Элементы словаря ===

  'GET /api/dictionaries/:code/items': {
    summary: 'Получить элементы словаря',
    description: 'Возвращает список элементов словаря. По умолчанию только активные.',
    tags: ['Элементы словаря'],
    params: codeParamSchema,
    query: z.object({
      includeInactive: z.coerce.boolean().optional().describe('Включить неактивные элементы'),
    }),
    response: dictionaryItemsListResponseSchema,
    responseExample: [dictionaryItemExample],
  },

  'POST /api/dictionaries/:code/items': {
    summary: 'Создать элемент словаря',
    description: 'Добавляет новый элемент в словарь.',
    tags: ['Элементы словаря'],
    params: codeParamSchema,
    body: createDictionaryItemSchema.omit({ dictionaryCode: true }),
    bodyExample: createItemExample,
    response: dictionaryItemResponseSchema,
    responseExample: { ...dictionaryItemExample, ...createItemExample },
  },

  'PATCH /api/dictionaries/:code/items/:id': {
    summary: 'Обновить элемент словаря',
    description: 'Обновляет данные элемента.',
    tags: ['Элементы словаря'],
    params: itemIdParamSchema,
    body: updateDictionaryItemSchema,
    bodyExample: updateItemExample,
    response: dictionaryItemResponseSchema,
    responseExample: { ...dictionaryItemExample, ...updateItemExample },
  },

  'DELETE /api/dictionaries/:code/items/:id': {
    summary: 'Удалить элемент словаря',
    description: 'Удаляет элемент. Дочерние элементы переносятся к родителю удаляемого элемента.',
    tags: ['Элементы словаря'],
    params: itemIdParamSchema,
  },
});
