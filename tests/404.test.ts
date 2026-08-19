import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from './helpers/buildTestApp';

describe('rota inexistente', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    await app.close();
  });

  it('retorna 404 com corpo padronizado', async () => {
    app = await buildTestApp();

    const response = await app.inject({ method: 'GET', url: '/rota-que-nao-existe' });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(body.error.requestId).toBeTruthy();
  });
});
