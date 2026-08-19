// Única fonte de carregamento do `.env` de todo o backend. Executa como
// efeito colateral de importação, ANTES de qualquer leitura de
// `process.env` neste módulo ou em quem o importa (server.ts, seed.ts,
// testes). Por isso nenhum outro arquivo do projeto deve importar
// `dotenv/config` diretamente — isso evitaria uma segunda fonte de
// verdade e ordens de carregamento inconsistentes entre `npm run dev`,
// `npm run prisma:seed` e `npm test`.
//
// `dotenv.config()` nunca sobrescreve variáveis já definidas no
// ambiente (ex.: exportadas pelo shell, ou injetadas por Docker/CI) —
// ele só preenche o que ainda não existir, lendo `.env` a partir do
// diretório de trabalho atual (a raiz do projeto, ao rodar via scripts
// do npm).
import { config as loadDotenv } from 'dotenv';
loadDotenv();

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().default('0.0.0.0'),

  // Banco (opcional em tempo de boot da Fase 4 — /ready reflete a ausência)
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

  SWAGGER_ENABLED: z
    .string()
    .default('true')
    .transform((value) => value === 'true'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Valida e normaliza as variáveis de ambiente. Lança um erro descritivo
 * na inicialização caso alguma variável obrigatória esteja ausente ou
 * em formato inválido — falha rápida (fail fast) é intencional aqui.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    throw new Error(`Variáveis de ambiente inválidas: ${JSON.stringify(formatted)}`);
  }

  return parsed.data;
}
