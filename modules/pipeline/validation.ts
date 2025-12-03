import { z } from 'zod';

// ==================== PIPELINE SCHEMAS ====================

export const createPipelineSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(100),
  code: z
    .string()
    .min(1, 'Код обязателен')
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Код может содержать только латинские буквы, цифры и _'),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const updatePipelineSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Код может содержать только латинские буквы, цифры и _')
    .optional(),
  description: z.string().max(500).nullable().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const pipelineFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    })
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// ==================== PIPELINE STAGE SCHEMAS ====================

export const createPipelineStageSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(100),
  code: z
    .string()
    .min(1, 'Код обязателен')
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Код может содержать только латинские буквы, цифры и _'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Неверный формат цвета')
    .optional()
    .default('#6b7280'),
  order: z.number().int().min(0).optional(),
  probability: z.number().int().min(0).max(100).optional().default(0),
  isInitial: z.boolean().optional().default(false),
  isFinal: z.boolean().optional().default(false),
  isWon: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updatePipelineStageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'Код может содержать только латинские буквы, цифры и _')
    .optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Неверный формат цвета').optional(),
  order: z.number().int().min(0).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  isInitial: z.boolean().optional(),
  isFinal: z.boolean().optional(),
  isWon: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const reorderStagesSchema = z.object({
  stageIds: z.array(z.string().min(1)).min(1),
});

export const reorderPipelinesSchema = z.object({
  pipelineIds: z.array(z.string().min(1)).min(1),
});

// Type inference
export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;
export type UpdatePipelineInput = z.infer<typeof updatePipelineSchema>;
export type PipelineFiltersInput = z.infer<typeof pipelineFiltersSchema>;
export type CreatePipelineStageInput = z.infer<typeof createPipelineStageSchema>;
export type UpdatePipelineStageInput = z.infer<typeof updatePipelineStageSchema>;
export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>;
export type ReorderPipelinesInput = z.infer<typeof reorderPipelinesSchema>;
