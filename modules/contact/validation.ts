import { z } from 'zod';

export const phoneTypeSchema = z.enum(['MOBILE', 'FIXED_LINE', 'UNKNOWN']);

// Sub-schemas for emails and phones
export const emailSchema = z.object({
  address: z.string().email('Invalid email format'),
  isVerified: z.boolean().optional().default(false),
  isSubscribed: z.boolean().optional().default(true),
  unsubscribedAt: z.coerce.date().optional(),
  bouncedAt: z.coerce.date().optional(),
  lastEmailedAt: z.coerce.date().optional(),
});

export const phoneSchema = z.object({
  e164: z.string().min(1, 'Phone number is required'),
  international: z.string().min(1, 'International format is required'),
  country: z.string().length(2, 'Country code must be 2 characters'),
  type: phoneTypeSchema.optional().default('UNKNOWN'),
  isPrimary: z.boolean().optional().default(false),
  isVerified: z.boolean().optional().default(false),
  isSubscribed: z.boolean().optional().default(true),
  unsubscribedAt: z.coerce.date().optional(),
  lastSmsAt: z.coerce.date().optional(),
});

export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  emails: z.array(emailSchema).optional().default([]),
  phones: z.array(phoneSchema).optional().default([]),
  company: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
  contactType: z.string().optional(),
  source: z.string().optional(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  emails: z.array(emailSchema).optional(),
  phones: z.array(phoneSchema).optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
  contactType: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
});

export const contactFiltersSchema = z.object({
  search: z.string().optional(),
  ownerId: z.string().optional(),
  contactType: z.string().optional(),
  source: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(30),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactFiltersInput = z.infer<typeof contactFiltersSchema>;
