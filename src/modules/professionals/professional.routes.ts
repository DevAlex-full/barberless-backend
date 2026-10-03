import { FastifyInstance } from 'fastify';
import { ProfessionalController } from './professional.controller';
import { createPrismaAdapter } from '../../shared/prisma/createPrismaAdapter';
import { authenticate, authorize } from '../../shared/auth/auth.middleware';

export async function professionalRoutes(fastify: FastifyInstance) {
  const { client: prisma } = createPrismaAdapter();
  if (!prisma) return;

  const controller = new ProfessionalController(prisma);

  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize(['OWNER', 'RECEPTIONIST', 'BARBER'])],
    handler: controller.list.bind(controller),
  });

  fastify.post('/', {
    preHandler: [authorize(['OWNER'])], // Only Owner can create professionals
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
