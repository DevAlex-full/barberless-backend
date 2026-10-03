import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido').trim().toLowerCase(),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido').trim().toLowerCase(),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'A confirmação da senha é obrigatória'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
