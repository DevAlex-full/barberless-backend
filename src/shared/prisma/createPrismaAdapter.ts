import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

export interface PrismaAdapterHandle {
  pool: Pool;
  adapter: PrismaPg;
}

/**
 * Fábrica única e compartilhada do driver adapter do Prisma 7 para
 * PostgreSQL. Todo ponto do projeto que precisa de um `PrismaClient`
 * fora da CLI (plugin da aplicação, seed, teste de integração) passa
 * por aqui — nenhum deles constrói `Pool`/`PrismaPg` por conta própria,
 * evitando três configurações de TLS divergentes.
 *
 * ## TLS: `rejectUnauthorized: false` — por quê, e até quando
 *
 * O Supabase (via pooler/pgbouncer) apresenta um certificado
 * autoassinado na cadeia. Sem isso, a conexão falha com
 * `self-signed certificate in certificate chain`. A conexão **continua
 * usando TLS** — os dados continuam criptografados em trânsito; o que
 * é relaxado é apenas a *verificação da cadeia de confiança* do
 * certificado apresentado pelo servidor, não a criptografia em si.
 *
 * Isso é **escopado exclusivamente a esta conexão PostgreSQL**, via a
 * opção `ssl` do `pg.Pool` — não há nenhuma alteração global do Node
 * (nunca `NODE_TLS_REJECT_UNAUTHORIZED=0`) nem enfraquecimento via
 * `sslmode=disable` na connection string. Qualquer outra conexão TLS
 * feita pela aplicação (ex.: chamadas HTTP a serviços externos em fases
 * futuras) continua com verificação completa da cadeia.
 *
 * Esta é uma decisão **temporária**, documentada em
 * `docs/phase-4-report.md`: o caminho definitivo é apontar `ssl.ca`
 * para o certificado da CA oficial do Supabase e voltar
 * `rejectUnauthorized` para `true` (verificação completa da cadeia).
 * Isso não foi implementado nesta fase por instrução explícita.
 */
export function createPrismaAdapter(connectionString: string = process.env.DATABASE_URL || '') {
  if (!connectionString) {
    return {
      pool: null,
      adapter: null,
      client: null,
    };
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  return { pool, adapter, client };
}
