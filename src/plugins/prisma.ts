import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient as PrismaClientType } from '../generated/prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClientType;
  }
}

export interface PrismaPluginOptions {
  databaseUrl?: string;
}

/**
 * Plugin Prisma (arquitetura Prisma 7 — driver adapters). Só instancia o
 * PrismaClient quando DATABASE_URL está configurada — nesta fase o banco
 * é opcional para o boot da aplicação, mas quando presente a conexão é
 * validada e disponibilizada via `fastify.prisma` para toda a aplicação
 * (incluindo a rota /ready). Usa DATABASE_URL (pooled) — DIRECT_URL é
 * reservado para a CLI do Prisma via `prisma.config.ts`.
 *
 * A partir do Prisma 7, o PrismaClient não aceita mais `datasourceUrl`
 * diretamente: a conexão é montada explicitamente via `pg.Pool` +
 * `PrismaPg` (driver adapter oficial para PostgreSQL), o que também
 * elimina a necessidade de um engine binário nativo em runtime — o
 * Prisma passa a falar com o banco através do driver `pg` puro em
 * JavaScript. O `Pool`/`PrismaPg` (incluindo a configuração de TLS) são
 * construídos pela fábrica compartilhada `createPrismaAdapter` — ver
 * `src/shared/prisma/createPrismaAdapter.ts` para os detalhes e a
 * justificativa de segurança.
 *
 * `createPrismaAdapter` e o client gerado são importados dinamicamente,
 * só quando `databaseUrl` está presente — evita o custo de carregar
 * `pg`/`@prisma/adapter-pg` em todo teste que roda sem banco (toda a
 * suíte padrão), que é a maioria. O `import type` acima (apagado em
 * tempo de compilação, sem custo em runtime) é suficiente para a
 * tipagem de `fastify.prisma`.
 */
export default fp(
  async function prismaPlugin(fastify: FastifyInstance, opts: PrismaPluginOptions) {
    if (!opts.databaseUrl) {
      fastify.log.warn('DATABASE_URL não configurada — plugin Prisma não conectado.');
      return;
    }

    const [{ createPrismaAdapter }, { PrismaClient }] = await Promise.all([
      import('../shared/prisma/createPrismaAdapter.js'),
      import('../generated/prisma/client.js'),
    ]);

    const { pool, adapter } = createPrismaAdapter(opts.databaseUrl);

    if (!adapter) {
      fastify.log.warn('Não foi possível criar o adapter do Prisma.');
      return;
    }

    const prisma = new PrismaClient({ adapter });

    await prisma.$connect();

    fastify.decorate('prisma', prisma);

    fastify.addHook('onClose', async (instance) => {
      await instance.prisma.$disconnect();
      if (pool) {
        await pool.end();
      }
    });
  },
  { name: 'prisma-plugin' },
);
