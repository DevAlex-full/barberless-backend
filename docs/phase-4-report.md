# Relatório — Fase 4 (Fundação Técnica) — Backend

> **Sétima e última revisão deste relatório para a Fase 4.** Sua
> validação local confirmou o backend funcionando de ponta a ponta contra
> o Supabase real: seed, teste de integração, `/health`, `/ready`,
> `/version`, `/docs`, `/docs/json`, servidor compilado, `format:check` e
> `npm audit` — tudo verde. A única falha restante era
> `tests/ready.test.ts` abrindo uma conexão TCP real por engano dentro de
> um teste que deveria ser puramente unitário. Corrigida nesta rodada,
> junto com uma vulnerabilidade nova (não relacionada) encontrada durante
> a revalidação. Nenhuma mudança funcional em Prisma, TLS,
> `createPrismaAdapter`, migrations, seed, runtime, Swagger, Fastify ou
> domínio.

---

## Correção desta rodada (1/2): `ready.test.ts` — de teste acidentalmente de integração para teste unitário de verdade

**Causa raiz:** o cenário `database: "ok"` do teste passava uma
`DATABASE_URL` sintaticamente válida (`postgresql://user:pass@localhost:5432/db`)
só para satisfazer a validação Zod — mas, sem nenhum mock em vigor, o
plugin real (`src/plugins/prisma.ts`) tentava abrir uma conexão TCP de
verdade para `localhost:5432`. Sem um PostgreSQL ouvindo nessa porta
durante a suíte unitária, isso resultava corretamente em `503`/
`database: "error"` — o teste estava, sem intenção, testando
comportamento de rede real, não a lógica de `/ready`.

**Correção:** `tests/ready.test.ts` agora mocka dois módulos — nos mesmos
caminhos que `src/plugins/prisma.ts` importa dinamicamente
(`../generated/prisma/client.js` e `../shared/prisma/createPrismaAdapter.js`,
vistos a partir de `tests/`) — via `vi.mock` + `vi.hoisted`, expondo
`queryRawMock` (controlável por teste) e
`connectMock`/`disconnectMock`/`poolEndMock` (sempre resolvem com
sucesso). `createPrismaAdapter` retorna um `pool`/`adapter` fake;
`PrismaClient` vira uma função construtora fake cujo `$queryRaw` cada
teste controla via `mockResolvedValue`/`mockRejectedValue`.

**Nenhum arquivo de produção foi alterado** — nem `src/plugins/prisma.ts`,
nem `src/shared/prisma/createPrismaAdapter.ts`, nem
`tests/prisma.integration.test.ts` (que continua exatamente como estava,
abrindo conexão real quando `DATABASE_URL`/`DIRECT_URL` estão presentes —
confirmado que a suíte completa, incluindo esse arquivo, continua se
conectando de verdade quando `.env` está presente; o `vi.mock` é escopado
só ao arquivo que o declara).

Os três cenários cobertos:

1. **Sem `DATABASE_URL`** → `200`, `database: "skipped"` — e valida
   adicionalmente que `connectMock` **nunca é chamado** (o plugin nem
   chega a instanciar o client fake).
2. **Com banco configurado, Prisma fake saudável** → `200`,
   `database: "ok"`.
3. **Prisma fake lançando erro** (caso opcional, incluído) → `503`,
   `status: "not_ready"`, `database: "error"`.

## Correção desta rodada (2/2): vulnerabilidade nova no `npm audit` (`deepmerge-ts`)

Ao reinstalar do zero para validar a correção acima, `npm audit` acusou
uma vulnerabilidade **nova**, não presente nas rodadas anteriores:

```
deepmerge-ts <8.0.0 — Severity: high
DeepmergeTS has stack exhaustion when merging recursive object graphs
```

**Causa:** `deepmerge-ts@7.1.5` é dependência transitiva de
`@prisma/config@7.9.1` (usada pela CLI do Prisma para carregar
`prisma.config.ts` — não pelo nosso código nem pelo runtime da
aplicação). Não veio de nenhuma mudança feita nesta rodada; é uma entrada
nova na base de advisories do npm para uma versão que já estava
instalada, só exposta porque reinstalamos do zero.

**Correção:** `overrides` no `package.json`, o mecanismo padrão do npm
para forçar a versão de uma dependência transitiva sem tocar na versão
do pacote que a traz:

```json
"overrides": {
  "deepmerge-ts": "^8.0.1"
}
```

`prisma`/`@prisma/client` continuam exatamente em `7.9.1`. `deepmerge-ts`
é usado só internamente pelo `@prisma/config` para mesclar objetos de
config — nosso código nunca o importa. Validado que a CLI continua
carregando `prisma.config.ts` normalmente com o override
(`npx prisma --version` chegou até o ponto usual de bloqueio de rede
deste sandbox, sem nenhum erro relacionado ao `deepmerge-ts`).

**Não usei `npm audit fix --force`** — instalaria `prisma@6.12.0`, uma
regressão de major version, exatamente o tipo de "correção" a evitar.

## Validação desta rodada — execução real

| Comando                                          | Resultado                                          |
| ------------------------------------------------ | -------------------------------------------------- |
| `npm run test -- tests/ready.test.ts`            | ✅ **3/3** (skipped / ok / error)                  |
| `npm run test` (suíte completa, com `.env` real) | ✅ **25/25**                                       |
| `npm run test:coverage`                          | ✅ `prisma.ts` 100%, `createPrismaAdapter.ts` 100% |
| `npm run build`                                  | ✅                                                 |
| `npm run validate`                               | ✅ (lint + typecheck + test + build)               |
| `npm run format:check`                           | ✅ sem divergências                                |
| `npm audit` (após o `overrides`)                 | ✅ **0 vulnerabilidades**                          |

---

## Histórico consolidado das rodadas anteriores

Resumo do que já foi corrigido e validado nas seis rodadas anteriores
desta fase (detalhes completos preservados no histórico de versões deste
documento):

1. **Stack modernizada:** Node 22 LTS (`>=22.12.0 <23`), Prisma 5→7
   (driver adapters, `prisma.config.ts`), ESLint 8→10 (flat config,
   `eslint.config.mjs`), Vitest 2→4 (`vitest.config.mts`), TypeScript 5→6
   — todas as versões verificadas via `npm view <pacote> peerDependencies`
   antes de decidir, não por suposição.
2. **Model técnico `SystemSetting`** — UUID via `gen_random_uuid()`,
   `key` único, `value` JSONB, timestamps — sem dados de negócio. Migration
   real testada contra Postgres local; seed idempotente.
3. **Output do Prisma em `src/generated/prisma`** (dentro de `rootDir`,
   não fora) — o Prisma 7 gera `.ts` reais, que precisam ser compilados
   pelo `tsc` do projeto; com o output fora de `rootDir`, `tsc` rejeitava
   com `TS6059`.
4. **`.env` — fonte única de carregamento**, centralizada em
   `src/config/env.ts` (`dotenv.config()` como efeito colateral de
   importação, antes de qualquer leitura de `process.env`). `seed.ts` e
   os testes consomem `loadEnv()` dessa fonte — não leem `process.env`
   direto nem carregam `dotenv` por conta própria. `prisma.config.ts`
   mantém seu próprio carregamento, justificado por rodar num processo
   CLI separado.
5. **TLS do driver adapter:** fábrica compartilhada
   `createPrismaAdapter(connectionString)` em
   `src/shared/prisma/createPrismaAdapter.ts` — único ponto do projeto
   com `ssl: { rejectUnauthorized: false }` (necessário pelo certificado
   autoassinado do pooler do Supabase; TLS continua ativo, só a
   verificação da cadeia é relaxada, escopado exclusivamente a essa
   conexão). Usado por `src/plugins/prisma.ts`, `prisma/seed.ts` e
   `tests/prisma.integration.test.ts` — zero duplicação. CA oficial do
   Supabase fica para uma fase futura, documentado, não implementado
   agora.
6. **`pluginTimeout: 30_000`** explícito em `src/app.ts` — corrige
   `AVV_ERR_PLUGIN_EXEC_TIMEOUT` no plugin de Swagger (que faz `import()`
   dinâmico de `@fastify/swagger`/`@fastify/swagger-ui`, mantido após
   testes de estabilidade sob o novo timeout). `tests/swagger.test.ts`
   cobre `SWAGGER_ENABLED=false`/`true`.
7. **DIRECT_URL** (CLI/migrations, via `prisma.config.ts`) vs
   **DATABASE_URL** (runtime, via `PrismaPg`) — arquitetura consistente
   em todos os pontos de conexão.

## ⚠️ Limitação de ambiente recorrente: `schema-engine` do Prisma (só neste sandbox)

`binaries.prisma.sh` (de onde o Prisma CLI baixa o `schema-engine`, usado
por `generate`/`migrate`) continua fora da allowlist de rede deste
sandbox — confirmado nesta rodada também (`npx prisma --version`).
**Isso não afeta você**: sua validação local já confirmou
`prisma generate`, `prisma migrate deploy` e o seed rodando de verdade
contra o Supabase, com rede irrestrita. O stub usado para validar
lint/typecheck/build neste sandbox (`src/generated/prisma/client.ts`)
nunca faz parte da entrega — `src/generated/` está no `.gitignore` e é
sempre excluído do zip.

## Não incluído nesta fase (por instrução explícita)

- Autenticação funcional.
- Usuários persistidos ou qualquer model de domínio (`User`, `Customer`,
  `Professional`, `Appointment`, `Service`, `Payment`).
- Qualquer módulo de negócio do PRD.
- CA oficial do Supabase para TLS (documentado como próximo passo).
