import type { FastifyInstance } from 'fastify';
import { getHealth, getReady } from './health.controller';

export default async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Verifica se o processo da aplicação está vivo.',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              uptime: { type: 'number' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async () => getHealth(),
  );

  fastify.get(
    '/ready',
    {
      schema: {
        tags: ['health'],
        summary:
          'Verifica se a aplicação está pronta para receber tráfego (inclui checagem de banco).',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              checks: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                },
              },
              timestamp: { type: 'string' },
            },
          },
          503: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              checks: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                },
              },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const result = await getReady(fastify);
      const statusCode: 200 | 503 = result.status === 'ready' ? 200 : 503;
      reply.status(statusCode).send(result);
    },
  );
}
