import { z } from 'zod';

// === Enums ===

export const dictionaryFieldTypeSchema = z.enum(['string', 'number', 'boolean', 'color', 'icon'])
  .describe('Тип поля: string - строка, number - число, boolean - да/нет, color - цвет, icon - иконка');

// === Sub-schemas ===

export const dictionaryFieldSchema = z.object({
  code: z.string().min(1, 'Код поля обязателен').regex(/^[a-z][a-z0-9_]*$/, 'Код должен содержать только латинские буквы, цифры и _').describe('Уникальный код поля'),
  name: z.string().min(1, 'Название поля обязательно').describe('Отображаемое название'),
  type: dictionaryFieldTypeSchema.describe('Тип поля'),
  required: z.boolean().default(false).describe('Обязательное поле'),
}).describe('Дополнительное поле словаря');

// === Input schemas (request body) ===

export const createDictionarySchema = z.object({
  code: z.string()
    .min(1, 'Код обязателен')
    .max(50, 'Код не должен превышать 50 символов')
    .regex(/^[a-z][a-z0-9_]*$/, 'Код должен содержать только латинские буквы в нижнем регистре, цифры и _')
    .describe('Уникальный код словаря'),
  name: z.string().min(1, 'Название обязательно').max(100, 'Название не должно превышать 100 символов').describe('Название словаря'),
  description: z.string().max(500, 'Описание не должно превышать 500 символов').optional().describe('Описание словаря'),
  allowHierarchy: z.boolean().optional().default(false).describe('Разрешить вложенные элементы'),
  maxDepth: z.number().int().min(1).max(3).optional().default(1).describe('Максимальная глубина вложенности (1-3)'),
  fields: z.array(dictionaryFieldSchema).optional().default([]).describe('Дополнительные поля'),
}).describe('Данные для создания словаря');

export const updateDictionarySchema = z.object({
  name: z.string().min(1).max(100).optional().describe('Название словаря'),
  description: z.string().max(500).optional().describe('Описание словаря'),
  allowHierarchy: z.boolean().optional().describe('Разрешить вложенные элементы'),
  maxDepth: z.number().int().min(1).max(3).optional().describe('Максимальная глубина вложенности'),
  fields: z.array(dictionaryFieldSchema).optional().describe('Дополнительные поля'),
}).describe('Данные для обновления словаря');

export const createDictionaryItemSchema = z.object({
  dictionaryCode: z.string().min(1, 'Код словаря обязателен').describe('Код родительского словаря'),
  code: z.string()
    .max(50, 'Код не должен превышать 50 символов')
    .regex(/^[a-z][a-z0-9_]*$/, 'Код должен содержать только латинские буквы в нижнем регистре, цифры и _')
    .optional()
    .describe('Уникальный код элемента'),
  name: z.string().min(1, 'Название обязательно').max(100, 'Название не должно превышать 100 символов').describe('Название элемента'),
  parentId: z.string().nullable().optional().default(null).describe('ID родительского элемента'),
  properties: z.record(z.string(), z.unknown()).optional().default({}).describe('Значения дополнительных полей'),
}).describe('Данные для создания элемента словаря');

export const updateDictionaryItemSchema = z.object({
  code: z.string()
    .max(50, 'Код не должен превышать 50 символов')
    .regex(/^[a-z][a-z0-9_]*$/, 'Код должен содержать только латинские буквы в нижнем регистре, цифры и _')
    .optional()
    .nullable()
    .describe('Уникальный код элемента'),
  name: z.string().min(1).max(100).optional().describe('Название элемента'),
  parentId: z.string().nullable().optional().describe('ID родительского элемента'),
  isActive: z.boolean().optional().describe('Активен ли элемент'),
  properties: z.record(z.string(), z.unknown()).optional().describe('Значения дополнительных полей'),
}).describe('Данные для обновления элемента словаря');

export const updateItemsOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string().describe('ID элемента'),
    weight: z.number().describe('Порядковый номер'),
    parentId: z.string().nullable().optional().describe('ID родительского элемента'),
  })).describe('Массив элементов с новым порядком'),
}).describe('Данные для обновления порядка элементов');

// === Response schemas ===

export const dictionaryResponseSchema = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  code: z.string().describe('Код словаря'),
  name: z.string().describe('Название'),
  description: z.string().optional().describe('Описание'),
  allowHierarchy: z.boolean().describe('Разрешена ли иерархия'),
  maxDepth: z.number().describe('Максимальная глубина'),
  fields: z.array(dictionaryFieldSchema).describe('Дополнительные поля'),
  itemCount: z.number().optional().describe('Количество элементов'),
  createdAt: z.coerce.date().describe('Дата создания'),
  updatedAt: z.coerce.date().describe('Дата обновления'),
}).describe('Словарь');

export const dictionaryItemResponseSchema: z.ZodType<{
  id: string;
  dictionaryCode: string;
  code?: string;
  name: string;
  weight: number;
  parentId: string | null;
  depth: number;
  isActive: boolean;
  properties: Record<string, unknown>;
  children?: unknown[];
  createdAt: Date;
  updatedAt: Date;
}> = z.object({
  id: z.string().describe('Уникальный идентификатор'),
  dictionaryCode: z.string().describe('Код словаря'),
  code: z.string().optional().describe('Код элемента'),
  name: z.string().describe('Название'),
  weight: z.number().describe('Порядковый номер'),
  parentId: z.string().nullable().describe('ID родителя'),
  depth: z.number().describe('Уровень вложенности'),
  isActive: z.boolean().describe('Активен ли элемент'),
  properties: z.record(z.string(), z.unknown()).describe('Дополнительные свойства'),
  children: z.array(z.lazy(() => dictionaryItemResponseSchema)).optional().describe('Дочерние элементы'),
  createdAt: z.coerce.date().describe('Дата создания'),
  updatedAt: z.coerce.date().describe('Дата обновления'),
}).describe('Элемент словаря');

export const dictionaryListResponseSchema = z.object({
  dictionaries: z.array(dictionaryResponseSchema).describe('Список словарей'),
  total: z.number().describe('Общее количество'),
}).describe('Список словарей');

export const dictionaryItemsListResponseSchema = z.object({
  items: z.array(dictionaryItemResponseSchema).describe('Список элементов'),
  total: z.number().describe('Общее количество'),
}).describe('Список элементов словаря');

// === Input Types (для валидации запросов) ===

export type CreateDictionaryInput = z.infer<typeof createDictionarySchema>;
export type UpdateDictionaryInput = z.infer<typeof updateDictionarySchema>;
export type CreateDictionaryItemInput = z.infer<typeof createDictionaryItemSchema>;
export type UpdateDictionaryItemInput = z.infer<typeof updateDictionaryItemSchema>;
export type UpdateItemsOrderInput = z.infer<typeof updateItemsOrderSchema>;
