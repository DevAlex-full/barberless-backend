/**
 * Teste de conexão real com o banco via Prisma Client + driver adapter.
 *
 * Diferente do resto da suíte (que roda sem rede/banco via
 * `app.inject()`), este arquivo só executa quando `DATABASE_URL` E
 * `DIRECT_URL` estão configuradas no `.env` — a mesma fonte central de
 * configuração (`src/config/env.ts`) usada pela aplicação e pelo seed,
 * não uma leitura solta de `process.env`. Em CI/local sem essas
 * variáveis, os testes aparecem como "skipped", não como falha, para
 * não quebrar `npm run test` em ambientes sem banco.
 *
 * A conexão em si usa `DATABASE_URL` (mesma URL/adapter que a aplicação
 * em runtime) via a mesma fábrica compartilhada
 * (`src/shared/prisma/createPrismaAdapter.ts`, com TLS já configurado
 * para o pooler do Supabase) — `DIRECT_URL` só entra na condição de
 * skip porque, se o `.env` está configurado para migrations reais, é
 * sinal de que o ambiente pretende validar a stack completa, não só a
 * metade.
 *
 * Rodar explicitamente com banco disponível:
 *   npm test -- tests/prisma.integration.test.ts   (com .env preenchido)
 */
import { afterAll, describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env';
import { createPrismaAdapter } from '../src/shared/prisma/createPrismaAdapter';
import { PrismaClient } from '../src/generated/prisma/client';

const env = loadEnv();
const hasRealDatabase = Boolean(env.DATABASE_URL && env.DIRECT_URL);

describe.skipIf(!hasRealDatabase)('Conexão Prisma real (requer DATABASE_URL e DIRECT_URL)', () => {
  const { pool, adapter } = createPrismaAdapter(env.DATABASE_URL as string);
  const prisma = new PrismaClient({ adapter });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  it('conecta de verdade e executa uma query simples', async () => {
    const result = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 as ok`;
    expect(result[0]?.ok).toBe(1);
  });

  it('lê/escreve no model técnico SystemSetting (upsert idempotente)', async () => {
    const key = 'test.integration-check';

    const first = await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: { source: 'vitest-integration' } },
      update: { value: { source: 'vitest-integration' } },
    });

    const second = await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: { source: 'vitest-integration' } },
      update: { value: { source: 'vitest-integration' } },
    });

    expect(first.id).toBe(second.id);
    expect(first.key).toBe(key);
  });
});

if (!hasRealDatabase) {
  describe('Conexão Prisma real', () => {
    it.skip('pulado: DATABASE_URL/DIRECT_URL não configuradas neste ambiente', () => {});
  });
}
