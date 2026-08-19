import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from './helpers/buildTestApp';

describe('Swagger (SWAGGER_ENABLED)', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    await app.close();
  });

  it('SWAGGER_ENABLED=false: /docs não é registrado (404)', async () => {
    app = await buildTestApp({ SWAGGER_ENABLED: 'false' });

    const response = await app.inject({ method: 'GET', url: '/docs' });

    expect(response.statusCode).toBe(404);
  });

  it('SWAGGER_ENABLED=true: /docs e /docs/json respondem corretamente', async () => {
    app = await buildTestApp({ SWAGGER_ENABLED: 'true' });

    const docsResponse = await app.inject({ method: 'GET', url: '/docs' });
    expect(docsResponse.statusCode).toBe(200);

    const jsonResponse = await app.inject({ method: 'GET', url: '/docs/json' });
    expect(jsonResponse.statusCode).toBe(200);

    const body = jsonResponse.json();
    expect(body.openapi).toBeDefined();
    expect(body.info?.title).toBe('BarberLess API');
  });

  it('SWAGGER_ENABLED=true: /health continua funcionando normalmente', async () => {
    app = await buildTestApp({ SWAGGER_ENABLED: 'true' });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
  });

  it('SWAGGER_ENABLED=true: /ready continua funcionando normalmente', async () => {
    app = await buildTestApp({ SWAGGER_ENABLED: 'true' });

    const response = await app.inject({ method: 'GET', url: '/ready' });

    expect(response.statusCode).toBe(200);
  });
});
