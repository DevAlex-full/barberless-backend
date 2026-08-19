# Arquitetura — barberless-backend

## Stack oficial

- Node.js 22 LTS (`>=22.12.0 <23`)
- Fastify 5
- TypeScript 6 (strict)
- Prisma 7 (driver adapters, `prisma.config.ts`) — PostgreSQL / Supabase
- Zod (validação de ambiente e, futuramente, de payloads de rota)
- Swagger/OpenAPI (`@fastify/swagger` + `@fastify/swagger-ui`)
- Pino (logs estruturados, com redaction de dados sensíveis)
- Helmet, CORS e Rate Limiting
- ESLint 10 (flat config) + `typescript-eslint`
- Vitest 4

## Princípio central: `buildApp()` vs `server.ts`

A aplicação é dividida em duas camadas:

- **`src/app.ts`** — `buildApp()` monta a instância Fastify inteira (plugins,
  rotas, error handlers) mas **não** chama `.listen()`. Isso permite que os
  testes automatizados usem `app.inject()` para simular requisições HTTP sem
  abrir portas de rede reais, tornando a suíte de testes rápida e isolada.
- **`src/server.ts`** — importa `buildApp()`, chama `.listen()` e registra o
  encerramento gracioso (`close-with-grace`) para `SIGINT`/`SIGTERM`.

## Estrutura de pastas

```
barberless-backend/
├── prisma.config.ts        # config oficial da CLI Prisma 7 (migrate/studio/seed)
├── prisma/
│   ├── schema.prisma         # datasource + generator + model técnico SystemSetting
│   ├── migrations/
│   └── seed.ts                # seed idempotente (driver adapter, DATABASE_URL)
└── src/
    ├── app.ts                 # buildApp()
    ├── server.ts               # inicialização + graceful shutdown
    ├── generated/
    │   └── prisma/              # OUTPUT do Prisma Client — gerado, gitignored
    ├── config/
    │   └── env.ts               # carrega .env + validação Zod (fonte única de configuração)
    ├── plugins/
    │   ├── prisma.ts            # decora fastify.prisma via driver adapter (pg + PrismaPg)
    │   ├── security.ts          # helmet + cors + rate-limit
    │   └── swagger.ts           # documentação OpenAPI em /docs
    ├── modules/
    │   └── health/               # único módulo HTTP de domínio da Fase 4
    │       ├── health.routes.ts
    │       ├── health.controller.ts
    │       └── health.schema.ts
    ├── routes/
    │   └── version.route.ts      # GET /version
    └── shared/
        ├── errors/                # AppError e subclasses
        └── http/                  # errorHandler + notFoundHandler
```

Os módulos de domínio das próximas fases (auth, clientes, agenda, financeiro
etc.) devem seguir o mesmo padrão do módulo `health`: uma pasta em
`src/modules/<dominio>` com `*.routes.ts`, `*.controller.ts` (ou
`*.service.ts` quando a lógica crescer) e `*.schema.ts`.

## Configuração de ambiente (`.env`) — fonte única

Todo carregamento de `.env` do processo Node (app, seed, testes) passa por
**um único lugar**: `src/config/env.ts`. O arquivo chama `dotenv.config()`
como efeito colateral de importação, **antes** de qualquer leitura de
`process.env` — inclusive antes da definição do schema Zod que valida as
variáveis. Isso significa que basta importar `loadEnv` (ou qualquer módulo
que dependa dele, como `src/app.ts`) para que o `.env` já esteja carregado.

Nenhum outro módulo do backend importa `dotenv/config` diretamente — nem
`prisma/seed.ts`, nem os testes. A única exceção justificada é
`prisma.config.ts`, que roda num processo completamente diferente (o
binário da CLI do Prisma, fora do grafo de módulos da nossa aplicação) e
por isso precisa da sua própria chamada — ver o comentário em
`prisma.config.ts` para a explicação completa dessa decisão.

## Tratamento de erros

Toda rota de negócio deve lançar (`throw`) uma subclasse de `AppError`
(`NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, ou
`AppError` diretamente para outros casos) em vez de retornar respostas de
erro manualmente. O `errorHandler` global (`src/shared/http/errorHandler.ts`)
é responsável por:

1. Traduzir `AppError`/subclasses para o `statusCode` e `code` corretos.
2. Traduzir `ZodError` para `400 VALIDATION_ERROR`.
3. Tratar erros nativos do Fastify (ex.: payload malformado) com base no
   `statusCode` que o próprio Fastify atribui.
4. Cair em `500 INTERNAL_ERROR` para qualquer erro não mapeado.

Toda resposta de erro inclui `requestId` (gerado via `randomUUID()` em
`genReqId`) para correlação direta com os logs estruturados do Pino.

## Logs e observabilidade

- Logger: Pino, nível configurável via `LOG_LEVEL`.
- Em desenvolvimento, saída formatada via `pino-pretty`; em produção, JSON
  estruturado puro (mais barato de processar por ferramentas de log).
- **Redaction**: campos sensíveis (`password`, `token`, `authorization`,
  `cookie`, `accessToken`, `refreshToken`) são automaticamente mascarados nos
  logs, mesmo que apareçam aninhados em `req.body`.
- Cada requisição recebe um `requestId` (UUID) correlacionável entre logs e
  resposta de erro.

## Banco de dados — arquitetura Prisma 7 (driver adapters)

O Prisma 7 mudou de arquitetura de forma profunda em relação à v5 usada na
primeira entrega desta fase. As diferenças que afetam diretamente este
projeto:

1. **`datasource.url` não existe mais em `schema.prisma`.** A URL de conexão
   agora vive em dois lugares diferentes, com propósitos diferentes:
   - **`prisma.config.ts`** (raiz do projeto) — usado **apenas pela CLI**
     (`prisma generate`, `migrate`, `studio`, `db seed`). Aponta para
     `DIRECT_URL` (conexão direta, sem pooler — migrations alteram schema e
     não devem passar por pgbouncer).
   - **`src/plugins/prisma.ts`** — usado pela **aplicação em runtime**.
     Monta a conexão explicitamente via `pg.Pool` (usando `DATABASE_URL`,
     pooled) + o driver adapter `PrismaPg` (`@prisma/adapter-pg`), e só
     então instancia `new PrismaClient({ adapter })`.

2. **Driver adapters são obrigatórios.** Antes, o Prisma Client falava com o
   banco através de um engine nativo (binário Rust) embutido. Agora, com
   driver adapters, o Prisma usa o driver `pg` puro em JavaScript para
   executar queries — **não há mais engine nativo em runtime**. Isso torna o
   client mais portátil (funciona bem em ambientes serverless, por exemplo).
   O que **continua** existindo é o `schema-engine`, um binário usado só
   pela **CLI** (para parsear/validar o schema e gerar migrations) — ver a
   limitação de ambiente documentada em `docs/phase-4-report.md`.

3. **Generator mudou de `prisma-client-js` para `prisma-client`**, com
   `output` **obrigatório e explícito** (antes era automático para dentro de
   `node_modules/@prisma/client`). Este projeto gera em
   `src/generated/prisma` — **dentro** de `src/` (`rootDir` do
   `tsconfig.json`), não fora. Isso é o oposto do que a primeira versão
   desta entrega fazia (output na raiz do projeto), e a mudança tem um
   motivo concreto, encontrado numa validação local real: o Prisma 7 gera
   arquivos **`.ts` de verdade** (não apenas `.js`/`.d.ts` pré-compilados),
   que precisam ser processados pelo `tsc` do próprio projeto. Com o output
   fora de `rootDir`, `tsc` rejeita com `TS6059: file is not under
rootDir`. Com o output dentro de `src/`, `tsc` inclui, typecheca e
   compila os arquivos gerados automaticamente para
   `dist/generated/prisma/` durante `npm run build` — confirmado
   verificando que `dist/generated/prisma/client.js` é criado de verdade
   pelo build, e que o servidor compilado (`node dist/server.js`) consegue
   importar esse caminho normalmente em runtime.

4. **`moduleFormat = "cjs"`** foi escolhido explicitamente no generator para
   manter o client gerado em CommonJS, compatível com o resto do backend
   (que continua CommonJS — não foi feita uma migração para ESM, que exigiria
   reescrever toda a inicialização do Fastify, configs de teste, etc. sem
   necessidade real, já que o Prisma 7 suporta CJS oficialmente via essa
   flag).

### Único model desta fase: `SystemSetting`

```prisma
model SystemSetting {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  key       String   @unique
  value     Json
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("system_settings")
}
```

Técnico, sem qualquer dado de negócio — existe para validar de ponta a
ponta o Prisma Client real, uma migration real e um seed real. Os models de
domínio (`User`, `Customer`, `Professional`, `Appointment`, `Service`,
`Payment`, etc.) só serão modelados nas fases seguintes.

### Conexão opcional no boot

O plugin Prisma (`src/plugins/prisma.ts`) só conecta quando `DATABASE_URL`
está definida. Isso permite rodar a suíte de testes e o CI sem exigir um
banco real quando não é necessário, enquanto a rota `/ready` reflete
corretamente o estado (`skipped` quando não configurado, `ok`/`error` quando
configurado).

## Timeout de inicialização de plugins

A instância Fastify é criada com `pluginTimeout: 30_000` (30s) — explícito
em `src/app.ts`, um único lugar, valendo para todos os plugins em
desenvolvimento e produção. O padrão do Fastify (10s) se mostrou
insuficiente em ambientes reais para o plugin de Swagger, que carrega
`@fastify/swagger`/`@fastify/swagger-ui` via `import()` dinâmico — ver
`docs/phase-4-report.md` para o diagnóstico completo do
`AVV_ERR_PLUGIN_EXEC_TIMEOUT` original. Não é um timeout infinito: um
plugin genuinamente travado ainda derruba o boot, só que com mais margem
para I/O lento.

## Segurança (RNF-005)

- **Helmet**: headers de segurança padrão habilitados globalmente.
- **CORS**: origem restrita via `CORS_ORIGIN` (suporta lista separada por
  vírgula ou `*` explícito para desenvolvimento).
- **Rate limiting**: global, configurável via `RATE_LIMIT_MAX` e
  `RATE_LIMIT_WINDOW_MS`.
- Segredos (`DATABASE_URL`, etc.) nunca são commitados — apenas
  `.env.example` (só com placeholders) versionado.

## Documentação de API

Swagger/OpenAPI disponível em `/docs`, habilitável/desabilitável via
`SWAGGER_ENABLED` (recomendado: `false` em produção, ou protegido por
autenticação quando a Fase de auth existir).

## ESLint (flat config)

Assim como o frontend, o backend migrou de `.eslintrc.json` (legado) para
`eslint.config.mjs` (flat config, obrigatório a partir do ESLint 9+). Usa o
pacote combinado `typescript-eslint` (que substitui os antigos
`@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` separados)
mais `eslint-config-prettier` para desativar regras que conflitam com o
Prettier.
