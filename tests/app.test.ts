import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from './helpers/buildTestApp';

describe('buildApp', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('constrói a aplicação sem iniciar um listener de rede', async () => {
    app = await buildTestApp();
    expect(app).toBeDefined();
    expect(app.server.listening).toBe(false);
  });

  it('expõe o env validado via app.config', async () => {
    app = await buildTestApp();
    expect(app.config.NODE_ENV).toBe('test');
  });
});
