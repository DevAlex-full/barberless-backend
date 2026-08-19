/**
 * Seed — Fase 4 (Fundação Técnica).
 *
 * Idempotente: usa `upsert` com uma chave fixa, então rodar uma vez ou
 * cem vezes produz sempre o mesmo estado. Cria apenas UMA configuração
 * técnica segura (`app.bootstrap`), sem nenhum dado de negócio — nada de
 * usuários, clientes, profissionais, serviços ou agendamentos, que só
 * serão modelados e semeados nas fases seguintes.
 *
 * Usa a mesma fonte central de configuração validada por Zod
 * (`src/config/env.ts`) e a mesma fábrica compartilhada de driver
 * adapter (`src/shared/prisma/createPrismaAdapter.ts`, com TLS
 * configurado) que a aplicação em runtime e o teste de integração —
 * nenhuma configuração duplicada. Usa `DATABASE_URL` (não `DIRECT_URL`):
 * `DIRECT_URL` é reservado para a CLI do Prisma via `prisma.config.ts`.
 */
import { loadEnv } from '../src/config/env';
import { createPrismaAdapter } from '../src/shared/prisma/createPrismaAdapter';
import { PrismaClient } from '../src/generated/prisma/client';

async function main(): Promise<void> {
  const env = loadEnv();

  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada — não é possível rodar o seed.');
  }

  const { pool, adapter } = createPrismaAdapter(env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.systemSetting.upsert({
      where: { key: 'app.bootstrap' },
      create: {
        key: 'app.bootstrap',
        value: { phase: 'fase-4', description: 'Fundação técnica inicial da BarberLess' },
      },
      update: {
        value: { phase: 'fase-4', description: 'Fundação técnica inicial da BarberLess' },
      },
    });

    // eslint-disable-next-line no-console -- saída informativa de um script CLI, não da aplicação
    console.log('[seed] Configuração técnica "app.bootstrap" validada (criada ou já existente).');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('[seed] Falha ao executar seed:', error);
  process.exit(1);
});
