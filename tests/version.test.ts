import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from './helpers/buildTestApp';
import packageJson from '../package.json';

describe('GET /version', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    await app.close();
  });

  it('retorna nome, versão e ambiente da API', async () => {
    app = await buildTestApp();

    const response = await app.inject({ method: 'GET', url: '/version' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.name).toBe(packageJson.name);
    expect(body.version).toBe(packageJson.version);
    expect(body.nodeEnv).toBe('test');
  });
});
