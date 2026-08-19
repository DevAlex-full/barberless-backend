import type { FastifyInstance } from 'fastify';
import type { HealthResponse, ReadyResponse } from './health.schema';

export function getHealth(): HealthResponse {
  return {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Verifica se a aplicação está pronta para receber tráfego.
 * Quando o Prisma está conectado (DATABASE_URL configurada), executa
 * um SELECT 1 real para validar a conectividade com o banco. Quando o
 * banco não está configurado (ex.: ambientes de foundation/CI sem
 * banco), o check é reportado como "skipped" e não derruba a rota.
 */
export async function getReady(fastify: FastifyInstance): Promise<ReadyResponse> {
  const timestamp = new Date().toISOString();

  if (!fastify.prisma) {
    return {
      status: 'ready',
      checks: { database: 'skipped' },
      timestamp,
    };
  }

  try {
    await fastify.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ready',
      checks: { database: 'ok' },
      timestamp,
    };
  } catch (error) {
    fastify.log.error({ err: error }, 'Falha no health check do banco de dados');
    return {
      status: 'not_ready',
      checks: { database: 'error' },
      timestamp,
    };
  }
}
