import { z } from 'zod';

export const opportunityStageSchema = z.enum([
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
]);

export const opportunityPrioritySchema = z.enum(['low', 'medium', 'high']);

export const createOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  value: z.number().min(0, 'Value must be positive'),
  currency: z.string().length(3).toUpperCase().optional(),
  stage: opportunityStageSchema.optional(),
  priority: opportunityPrioritySchema.optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.coerce.date().optional(),
  contactId: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  value: z.number().min(0, 'Value must be positive').optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  stage: opportunityStageSchema.optional(),
  priority: opportunityPrioritySchema.optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.coerce.date().optional(),
  actualCloseDate: z.coerce.date().optional(),
  contactId: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const opportunityFiltersSchema = z.object({
  search: z.string().optional(),
  stage: opportunityStageSchema.optional(),
  priority: opportunityPrioritySchema.optional(),
  ownerId: z.string().optional(),
  contactId: z.string().optional(),
  minValue: z.coerce.number().optional(),
  maxValue: z.coerce.number().optional(),
  tags: z.array(z.string()).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type OpportunityFiltersInput = z.infer<typeof opportunityFiltersSchema>;
