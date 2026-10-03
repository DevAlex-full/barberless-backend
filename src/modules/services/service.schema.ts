import { z } from 'zod';

export const serviceCreateSchema = z.object({
  name: z.string().min(2, 'Nome do serviço é obrigatório').max(100),
  description: z.string().optional(),
  price: z.number().int().min(0, 'O preço não pode ser negativo'),
  duration: z.number().int().min(1, 'A duração deve ser de pelo menos 1 minuto'),
  isActive: z.boolean().default(true),
});

export const serviceUpdateSchema = serviceCreateSchema.partial();

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
