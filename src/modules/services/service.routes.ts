import { FastifyInstance } from 'fastify';
import { ServiceController } from './service.controller';
import { createPrismaAdapter } from '../../shared/prisma/createPrismaAdapter';
import { authenticate, authorize } from '../../shared/auth/auth.middleware';

export async function serviceRoutes(fastify: FastifyInstance) {
  const { client: prisma } = createPrismaAdapter();
  if (!prisma) return;

  const controller = new ServiceController(prisma);

  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize(['OWNER', 'RECEPTIONIST', 'BARBER'])],
    handler: controller.list.bind(controller),
  });

  fastify.post('/', {
    preHandler: [authorize(['OWNER'])],
    handler: controller.create.bind(controller),
  });

  fastify.get('/:id', {
    preHandler: [authorize(['OWNER', 'RECEPTIONIST', 'BARBER'])],
    handler: controller.get.bind(controller),
  });

  fastify.patch('/:id', {
    preHandler: [authorize(['OWNER'])],
    handler: controller.update.bind(controller),
  });

  fastify.delete('/:id', {
    preHandler: [authorize(['OWNER'])],
    handler: controller.delete.bind(controller),
  });
}
