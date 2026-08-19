import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export interface SecurityPluginOptions {
  corsOrigin: string;
  rateLimitMax: number;
  rateLimitWindowMs: number;
}

function parseOrigins(raw: string): string[] | boolean {
  if (raw.trim() === '*') return true;
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Registra as camadas de segurança HTTP básicas exigidas pelo PRD
 * (RNF-005): headers de segurança (Helmet), CORS restritivo por
 * variável de ambiente e rate limiting global.
 */
export default fp(
  async function securityPlugin(fastify: FastifyInstance, opts: SecurityPluginOptions) {
    await fastify.register(helmet, {
      global: true,
    });

    await fastify.register(cors, {
      origin: parseOrigins(opts.corsOrigin),
      credentials: true,
    });

    await fastify.register(rateLimit, {
      max: opts.rateLimitMax,
      timeWindow: opts.rateLimitWindowMs,
    });
  },
  { name: 'security-plugin' },
);
