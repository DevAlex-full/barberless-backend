import { z } from 'zod';

export const customerCreateSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório').max(100),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  birthDate: z.string().datetime().optional().nullable(),
  observations: z.string().optional(),
  allergies: z.string().optional(),
  classification: z.number().int().min(0).max(5).default(0),
  consentLgpd: z.boolean().default(false),
});

export const customerUpdateSchema = customerCreateSchema.partial();

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
