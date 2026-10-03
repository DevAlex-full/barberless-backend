import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from './helpers/buildTestApp';

/**
 * `/ready` é um teste unitário/de infraestrutura leve — não deve
 * depender de um PostgreSQL real. Quando o cenário exige "banco
 * configurado", o driver adapter (`createPrismaAdapter`) e o Prisma
 * Client gerado (`src/generated/prisma/client`) são substituídos por
 * fakes via `vi.mock`, controlados por `queryRawMock`/`connectMock`
 * (definidos com `vi.hoisted` para ficarem acessíveis tanto dentro das
 * factories de mock quanto no corpo dos testes).
 *
 * O teste de conexão *real* contra o banco (Supabase/Postgres de
 * verdade) já existe, separado, em `tests/prisma.integration.test.ts` —
 * este arquivo nunca deve abrir uma conexão de rede de verdade.
 */
const { queryRawMock, connectMock, disconnectMock, poolEndMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
  connectMock: vi.fn().mockResolvedValue(undefined),
  disconnectMock: vi.fn().mockResolvedValue(undefined),
  poolEndMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/generated/prisma/client.js', () => ({
  PrismaClient: vi.fn().mockImplementation(function MockPrismaClient() {
    return {
      $connect: connectMock,
      $disconnect: disconnectMock,
      $queryRaw: queryRawMock,
    };
  }),
}));

vi.mock('../src/shared/prisma/createPrismaAdapter.js', () => ({
  createPrismaAdapter: vi.fn().mockImplementation(() => ({
    pool: { end: poolEndMock },
    adapter: {},
  })),
}));

describe('GET /ready', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    connectMock.mockClear().mockResolvedValue(undefined);
    disconnectMock.mockClear().mockResolvedValue(undefined);
    poolEndMock.mockClear().mockResolvedValue(undefined);
    queryRawMock.mockReset();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('reporta database "skipped" quando DATABASE_URL não está configurada', async () => {
    app = await buildTestApp({
      DATABASE_URL: undefined,
    });

    const response = await app.inject({ method: 'GET', url: '/ready' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('ready');
    expect(body.checks.database).toBe('skipped');
    // Sem DATABASE_URL, o plugin nem chega a instanciar o client —
    // confirma que nenhuma conexão (real ou fake) foi tentada.
    expect(connectMock).not.toHaveBeenCalled();
  });

  it('reporta database "ok" quando DATABASE_URL está configurada e o Prisma fake responde', async () => {
    queryRawMock.mockResolvedValue([{ ok: 1 }]);

    app = await buildTestApp({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    });

    const response = await app.inject({ method: 'GET', url: '/ready' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('ready');
    expect(body.checks.database).toBe('ok');
    expect(queryRawMock).toHaveBeenCalledTimes(1);
  });

  it('reporta database "error" e status 503 quando o Prisma fake falha na query', async () => {
    queryRawMock.mockRejectedValue(new Error('conexão simulada falhou'));

    app = await buildTestApp({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    });

    const response = await app.inject({ method: 'GET', url: '/ready' });

    expect(response.statusCode).toBe(503);
    const body = response.json();
    expect(body.status).toBe('not_ready');
    expect(body.checks.database).toBe('error');
  });
});
