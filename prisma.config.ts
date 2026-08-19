// Arquivo de configuração oficial da CLI do Prisma a partir da v7,
// substituindo o antigo par `.env` + `datasource.url` dentro de
// schema.prisma. Usado apenas pela CLI (generate, migrate, studio,
// seed) — a aplicação em runtime (Fastify) NÃO lê este arquivo; ela usa
// sua própria validação de ambiente (`src/config/env.ts`) e monta a
// conexão via driver adapter em `src/plugins/prisma.ts`.
//
// Por que `dotenv/config` aparece aqui E em `src/config/env.ts`, e não
// é "espalhar" a mesma coisa: são dois processos completamente
// diferentes. Este arquivo é executado pelo binário `prisma` (CLI),
// fora do grafo de módulos da nossa aplicação — ele nunca importa nem é
// importado por `src/config/env.ts`. Cada processo precisa carregar o
// `.env` uma única vez, o mais cedo possível, antes de ler qualquer
// variável — por isso o app tem sua fonte única (`src/config/env.ts`) e
// a CLI tem a dela (aqui). Nenhum outro arquivo do projeto — nem
// `prisma/seed.ts`, nem os testes — carrega `dotenv` diretamente; todos
// consomem `loadEnv()` de `src/config/env.ts`.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Comando de seed executado após `prisma migrate dev`/`migrate reset`.
    // Substitui o antigo campo `"prisma": { "seed": "..." }` do package.json.
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // A CLI (migrate/studio) usa a conexão DIRETA (sem pooler), já que
    // comandos de migração alteram o schema e não devem passar por um
    // pooler como o pgbouncer do Supabase. A aplicação em runtime usa
    // DATABASE_URL (pooled) — ver src/plugins/prisma.ts.
    url: env('DIRECT_URL'),
  },
});
