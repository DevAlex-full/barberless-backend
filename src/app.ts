import Fastify, { type FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { loadEnv, type Env } from './config/env';
import prismaPlugin from './plugins/prisma';
import securityPlugin from './plugins/security';
import swaggerPlugin from './plugins/swagger';
import healthRoutes from './modules/health/health.routes';
import versionRoute from './routes/version.route';
import { errorHandler } from './shared/http/errorHandler';
import { notFoundHandler } from './shared/http/notFoundHandler';

export interface BuildAppOptions {
  env?: Env;
}

/**
 * Monta a instância Fastify com todos os plugins e rotas registrados,
 * sem chamar `listen()`. Separar a construção da aplicação da sua
 * inicialização como servidor HTTP permite reutilizar exatamente a
 * mesma instância nos testes automatizados (via `app.inject()`),
 * evitando side effects de rede.
 */
export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const env = options.env ?? loadEnv();

  const app = Fastify({
    genReqId: () => randomUUID(),
    // Timeout explícito para inicialização de plugins. O padrão do
    // Fastify (10s) se mostrou insuficiente em ambientes reais para o
    // plugin de Swagger, que faz `import()` dinâmico de
    // `@fastify/swagger`/`@fastify/swagger-ui` (pacotes relativamente
    // pesados — a UI empacota assets estáticos) — em máquinas/discos
    // mais lentos isso pode ultrapassar 10s e derrubar o boot com
    // `AVV_ERR_PLUGIN_EXEC_TIMEOUT`. 30s dá margem confortável sem ser
    // um timeout infinito (um plugin genuinamente travado ainda derruba
    // o processo, só que depois de 30s em vez de 10s).
    pluginTimeout: 30_000,
    logger: {
      level: env.LOG_LEVEL,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.token',
          'req.body.refreshToken',
          '*.password',
          '*.token',
          '*.accessToken',
          '*.refreshToken',
        ],
        censor: '[REDACTED]',
      },
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
            }
          : undefined,
    },
  });

  app.decorate('config', env);

  await app.register(securityPlugin, {
    corsOrigin: env.CORS_ORIGIN,
    rateLimitMax: env.RATE_LIMIT_MAX,
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  });

  await app.register(swaggerPlugin, { enabled: env.SWAGGER_ENABLED });

  await app.register(prismaPlugin, { databaseUrl: env.DATABASE_URL });

  await app.register(healthRoutes);
  await app.register(versionRoute);

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    config: Env;
  }
}
