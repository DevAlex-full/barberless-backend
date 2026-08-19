# BarberLess — Backend

API oficial da plataforma BarberLess.

> **Status:** Fase 4 — Fundação Técnica. Sem autenticação funcional, sem
> usuários persistidos e sem módulos de negócio implementados ainda. Este
> repositório contém apenas a base estrutural (servidor, segurança,
> observabilidade, banco, testes e CI) sobre a qual as próximas fases serão
> construídas. O único model existente é `SystemSetting` (técnico).

> ⚠️ **Ao atualizar para um novo ZIP desta entrega:** apague a pasta
> extraída da versão anterior por completo antes de extrair a nova (ou
> extraia em uma pasta vazia). Ferramentas de extração não removem
> arquivos que existiam no ZIP antigo e não estão mais no novo — só
> sobrescrevem os que têm o mesmo nome. Isso pode deixar configs legadas
> órfãs (ex.: um `vitest.config.ts` de uma entrega anterior à migração
> para `vitest.config.mts`) que o Vite/Vitest ainda encontra e usa por
> engano.

## Stack

Node.js 22 LTS · Fastify 5 · TypeScript 6 (strict) · Prisma 7 (driver
adapters, `prisma.config.ts`) · PostgreSQL (Supabase) · Zod · Swagger/OpenAPI
· Pino · Helmet · CORS · Rate limiting · ESLint 10 (flat config) · Vitest 4

## Requisitos

- Node.js `22.12.x` ou superior da série 22 (ver `.nvmrc`)
- npm
- PostgreSQL (Supabase em produção; Docker Compose ou instância local para
  desenvolvimento)

## Como rodar localmente

```bash
# 1. Instale as dependências
npm install

# 2. Configure o ambiente
cp .env.example .env
# preencha DATABASE_URL / DIRECT_URL (Supabase ou docker compose up -d)

# 3. Gere o client do Prisma (cria src/generated/prisma/)
npm run prisma:generate

# 4. Aplique as migrations
npm run prisma:migrate:dev

# 5. (Opcional) rode o seed idempotente
npm run prisma:seed

# 6. Suba o servidor em modo desenvolvimento
npm run dev
```

O servidor sobe em `http://localhost:3333` por padrão. Documentação OpenAPI
disponível em `http://localhost:3333/docs` (quando `SWAGGER_ENABLED=true`).

## Scripts disponíveis

| Script                                      | Descrição                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`                               | Sobe o servidor em modo watch                                           |
| `npm run build`                             | Compila TypeScript para `dist/`                                         |
| `npm start`                                 | Roda a build compilada                                                  |
| `npm run lint` / `lint:fix`                 | ESLint 10 (flat config, `eslint.config.mjs`)                            |
| `npm run typecheck`                         | Checagem de tipos sem emitir arquivos                                   |
| `npm test` / `test:watch` / `test:coverage` | Vitest 4                                                                |
| `npm run format` / `format:check`           | Prettier                                                                |
| `npm run validate`                          | lint + typecheck + test + build (gate de CI local; não altera arquivos) |
| `npm run prisma:generate`                   | Gera o Prisma Client em `src/generated/prisma/`                         |
| `npm run prisma:migrate:dev`                | Cria/aplica migration em desenvolvimento                                |
| `npm run prisma:migrate:deploy`             | Aplica migrations pendentes (produção/CI)                               |
| `npm run prisma:seed`                       | Executa o seed idempotente                                              |
| `npm run prisma:studio`                     | Abre o Prisma Studio                                                    |

## Endpoints técnicos disponíveis nesta fase

| Método | Rota       | Descrição                                                    |
| ------ | ---------- | ------------------------------------------------------------ |
| `GET`  | `/health`  | Liveness — processo está de pé                               |
| `GET`  | `/ready`   | Readiness — inclui checagem real de banco quando configurado |
| `GET`  | `/version` | Nome, versão e ambiente da API                               |
| `GET`  | `/docs`    | Documentação OpenAPI (Swagger UI)                            |

## Testando a conexão real com o banco

A suíte padrão (`npm test`) roda sem banco (rápida, isolada). Para validar
a conexão Prisma **real**, configure `DATABASE_URL`/`DIRECT_URL` e rode:

```bash
DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." npm test
```

O arquivo `tests/prisma.integration.test.ts` só executa quando essas
variáveis estão presentes — sem elas, aparece como "skipped", não como
falha.

## Documentação adicional

- [`docs/architecture.md`](./docs/architecture.md) — decisões de arquitetura
- [`docs/environment.md`](./docs/environment.md) — variáveis de ambiente
- [`docs/phase-4-report.md`](./docs/phase-4-report.md) — relatório de entrega da Fase 4

## Licença

Uso proprietário — BarberLess. Todos os direitos reservados.
