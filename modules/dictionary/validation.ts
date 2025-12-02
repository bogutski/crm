import { z } from 'zod';

// Схема поля словаря
export const dictionaryFieldSchema = z.object({
  code: z.string().min(1, 'Код поля обязателен').regex(/^[a-z][a-z0-9_]*$/, 'Код должен содержать только латинские буквы, цифры и _'),
  name: z.string().min(1, 'Название поля обязательно'),
  type: z.enum(['string', 'number', 'boolean', 'color', 'icon']),
  required: z.boolean().default(false),
});

// Схема создания словаря
export const createDictionarySchema = z.object({
  code: z.string()
    .min(1, 'Код обязателен')
    .max(50, 'Код не должен превышать 50 символов')
    .regex(/^[a-z][a-z0-9_]*$/, 'Код должен содержать только латинские буквы в нижнем регистре, цифры и _'),
  name: z.string().min(1, 'Название обязательно').max(100, 'Название не должно превышать 100 символов'),
  description: z.string().max(500, 'Описание не должно превышать 500 символов').optional(),
  allowHierarchy: z.boolean().optional().default(false),
  maxDepth: z.number().int().min(1).max(3).optional().default(1),
  fields: z.array(dictionaryFieldSchema).optional().default([]),
});

// Схема обновления словаря
export const updateDictionarySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  allowHierarchy: z.boolean().optional(),
  maxDepth: z.number().int().min(1).max(3).optional(),
  fields: z.array(dictionaryFieldSchema).optional(),
});

// Схема создания элемента словаря
export const createDictionaryItemSchema = z.object({
  dictionaryCode: z.string().min(1, 'Код словаря обязателен'),
  code: z.string()
    .max(50, 'Код не должен превышать 50 символов')
    .regex(/^[a-z][a-z0-9_]*$/, 'Код должен содержать только латинские буквы в нижнем регистре, цифры и _')
    .optional(),
  name: z.string().min(1, 'Название обязательно').max(100, 'Название не должно превышать 100 символов'),
  parentId: z.string().nullable().optional().default(null),
  properties: z.record(z.string(), z.unknown()).optional().default({}),
});

// Схема обновления элемента словаря
export const updateDictionaryItemSchema = z.object({
  code: z.string()
    .max(50, 'Код не должен превышать 50 символов')
    .regex(/^[a-z][a-z0-9_]*$/, 'Код должен содержать только латинские буквы в нижнем регистре, цифры и _')
    .optional()
    .nullable(),
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

// Схема обновления порядка элементов
export const updateItemsOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    weight: z.number(),
    parentId: z.string().nullable().optional(),
  })),
});

// Типы из схем
export type CreateDictionaryInput = z.infer<typeof createDictionarySchema>;
export type UpdateDictionaryInput = z.infer<typeof updateDictionarySchema>;
export type CreateDictionaryItemInput = z.infer<typeof createDictionaryItemSchema>;
export type UpdateDictionaryItemInput = z.infer<typeof updateDictionaryItemSchema>;
export type UpdateItemsOrderInput = z.infer<typeof updateItemsOrderSchema>;
