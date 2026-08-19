# Variáveis de ambiente — barberless-backend

> **Node.js:** requisito mínimo `22.12.0` (`engines.node` no `package.json`:
> `>=22.12.0 <23`). Node 20 saiu da política oficial de suporte e não é mais
> usado neste projeto. O `.nvmrc` aponta para `22`, que resolve para a
> última patch da série 22.x.

Todas as variáveis são validadas via Zod em `src/config/env.ts`. A
aplicação falha rápido (fail fast) na inicialização se alguma variável
obrigatória estiver ausente ou em formato inválido.

| Variável               | Obrigatória | Padrão                  | Descrição                                                                                                                                          |
| ---------------------- | ----------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`             | Não         | `development`           | `development` \| `test` \| `production`                                                                                                            |
| `PORT`                 | Não         | `3333`                  | Porta HTTP do servidor                                                                                                                             |
| `HOST`                 | Não         | `0.0.0.0`               | Host de bind do servidor                                                                                                                           |
| `DATABASE_URL`         | Não*        | —                       | Connection string **pooled** do Postgres (Supabase, via pgbouncer) — usada pela **aplicação em runtime** (`src/plugins/prisma.ts`, driver adapter) |
| `DIRECT_URL`           | Não*        | —                       | Connection string **direta** (sem pooler) — usada pela **CLI do Prisma** (`prisma.config.ts`: generate/migrate/studio/seed)                        |
| `CORS_ORIGIN`          | Não         | `http://localhost:3000` | Origem(ns) permitida(s), separadas por vírgula, ou `*`                                                                                             |
| `RATE_LIMIT_MAX`       | Não         | `100`                   | Máximo de requisições por janela                                                                                                                   |
| `RATE_LIMIT_WINDOW_MS` | Não         | `60000`                 | Janela do rate limit em milissegundos                                                                                                              |
| `SWAGGER_ENABLED`      | Não         | `true`                  | Habilita/desabilita `/docs`                                                                                                                        |
| `LOG_LEVEL`            | Não         | `info`                  | Nível do Pino: `fatal`\|`error`\|`warn`\|`info`\|`debug`\|`trace`\|`silent`                                                                        |

\* `DATABASE_URL`/`DIRECT_URL` são opcionais **apenas no boot da aplicação**
nesta fase — sem elas, o plugin Prisma não conecta e `/ready` reporta
`database: "skipped"`. Para desenvolvimento local, migrations, ou produção
com banco real, ambas devem ser configuradas — **nunca com valores reais
commitados**, apenas no seu `.env` local (gitignored) ou nas secrets do seu
provedor de deploy. `.env.example` contém somente placeholders.

## Configuração local (Supabase)

1. Crie um projeto no Supabase.
2. Copie a **Connection string** (modo _Transaction_ / pooler) para
   `DATABASE_URL` e a **Direct connection** para `DIRECT_URL`.
3. Copie `.env.example` para `.env` e preencha os valores.
4. Rode `npm run prisma:generate` (gera `src/generated/prisma/`) e
   `npm run prisma:migrate:dev` (aplica as migrations, incluindo o model
   técnico `SystemSetting`).

## Configuração local alternativa (Postgres via Docker)

```bash
docker compose up -d
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/barberless_dev
# DIRECT_URL=postgresql://postgres:postgres@localhost:5432/barberless_dev
```
