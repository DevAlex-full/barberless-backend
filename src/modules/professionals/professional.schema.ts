import { z } from 'zod';

export const professionalCreateSchema = z.object({
  userId: z.string().uuid('ID do usuário inválido'),
  name: z.string().min(2, 'Nome é obrigatório').max(100),
  specialty: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().url('URL da foto inválida').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const professionalUpdateSchema = professionalCreateSchema.partial();

export type ProfessionalCreateInput = z.infer<typeof professionalCreateSchema>;
export type ProfessionalUpdateInput = z.infer<typeof professionalUpdateSchema>;
