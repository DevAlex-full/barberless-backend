import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { createPrismaAdapter } from '../../shared/prisma/createPrismaAdapter';

export async function authRoutes(fastify: FastifyInstance) {
  const { client: prisma } = createPrismaAdapter();

  if (!prisma) {
    fastify.log.warn('Rotas de autenticação desativadas: Prisma não inicializado.');
    return;
  }

  const controller = new AuthController(prisma);

  fastify.post('/register', {
    handler: controller.register.bind(controller),
  });

  fastify.post('/login', {
    handler: controller.login.bind(controller),
  });

  fastify.post('/logout', {
    handler: controller.logout.bind(controller),
  });
}
