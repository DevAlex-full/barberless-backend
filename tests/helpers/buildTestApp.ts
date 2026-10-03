import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { loadEnv } from '../../src/config/env';

/**
 * Constrói a app para testes.
 *
 * Importante: desde que `src/config/env.ts` passou a carregar `.env`
 * automaticamente (fonte única de configuração), `process.env` pode já
 * conter `DATABASE_URL`/`DIRECT_URL` reais se houver um `.env` local
 * preenchido — o que é o comportamento correto para quem está validando
 * a stack completa. Por isso este helper **sempre** desliga
 * explicitamente essas duas variáveis por padrão (`undefined`, não uma
 * string vazia — `undefined` é o que o schema Zod trata como "ausente"
 * para um campo opcional), garantindo que a suíte padrão continue rápida
 * e independente de infraestrutura externa mesmo com um `.env` real
 * presente no ambiente.
 *
 * Testes que precisam simular o banco configurado (ex.: `/ready`
 * retornando `database: "ok"`) devem passar `DATABASE_URL`/`DIRECT_URL`
 * explicitamente via `envOverrides` — nunca depender do `.env` ambiente
 * por acidente.
 */
export async function buildTestApp(
  envOverrides: Record<string, string | undefined> = {},
): Promise<FastifyInstance> {
  const env = loadEnv({
    ...process.env,
    NODE_ENV: 'test',
    SWAGGER_ENABLED: 'false',
    ...envOverrides,
  });

  return buildApp({ env });
}
