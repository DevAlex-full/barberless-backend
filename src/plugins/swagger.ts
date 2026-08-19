import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export interface SwaggerPluginOptions {
  enabled: boolean;
}

/**
 * Documentação OpenAPI, servida em /docs. Pode ser desativada em
 * produção via SWAGGER_ENABLED=false, conforme exigido pelo escopo
 * da Fase 4.
 *
 * `@fastify/swagger` e, principalmente, `@fastify/swagger-ui` (que
 * empacota os assets estáticos da UI) são importados dinamicamente,
 * só quando `enabled` é verdadeiro. Como toda a suíte de testes roda
 * com `SWAGGER_ENABLED=false` (ver `tests/helpers/buildTestApp.ts`),
 * isso evita pagar o custo de carregar esses pacotes pesados em cada um
 * dos testes — import estático desnecessário era uma causa real de
 * lentidão, especialmente notável em Windows (resolução de módulos em
 * disco é mais cara lá do que em Linux/macOS).
 */
export default fp(
  async function swaggerPlugin(fastify: FastifyInstance, opts: SwaggerPluginOptions) {
    if (!opts.enabled) {
      fastify.log.info('Swagger desabilitado via SWAGGER_ENABLED=false.');
      return;
    }

    const [{ default: swagger }, { default: swaggerUi }] = await Promise.all([
      import('@fastify/swagger'),
      import('@fastify/swagger-ui'),
    ]);

    await fastify.register(swagger, {
      openapi: {
        info: {
          title: 'BarberLess API',
          description: 'API oficial da BarberLess — Fase 4: Fundação Técnica.',
          version: '0.1.0',
        },
        tags: [{ name: 'health', description: 'Endpoints técnicos de saúde da aplicação' }],
      },
    });

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
    });
  },
  { name: 'swagger-plugin' },
);
