import { FastifyInstance } from 'fastify';
import { CustomerController } from './customer.controller';
import { createPrismaAdapter } from '../../shared/prisma/createPrismaAdapter';
import { authenticate, authorize } from '../../shared/auth/auth.middleware';

export async function customerRoutes(fastify: FastifyInstance) {
  const { client: prisma } = createPrismaAdapter();
  if (!prisma) return;

  const controller = new CustomerController(prisma);

  // All customer management requires Staff permissions
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize(['OWNER', 'RECEPTIONIST'])],
    handler: controller.list.bind(controller),
  });

  fastify.post('/', {
    preHandler: [authorize(['OWNER', 'RECEPTIONIST'])],
    handler: controller.create.bind(controller),
  });

  fastify.get('/:id', {
    preHandler: [authorize(['OWNER', 'RECEPTIONIST'])],
    handler: controller.get.bind(controller),
  });

  fastify.patch('/:id', {
    preHandler: [authorize(['OWNER', 'RECEPTIONIST'])],
    handler: controller.update.bind(controller),
  });

  fastify.delete('/:id', {
    preHandler: [authorize(['OWNER', 'RECEPTIONIST'])],
    handler: controller.delete.bind(controller),
  });
}
