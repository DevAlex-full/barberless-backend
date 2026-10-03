import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@/generated/prisma/client';
import { serviceCreateSchema, serviceUpdateSchema } from './service.schema';
import { NotFoundError } from '../../shared/errors';

export class ServiceController {
  constructor(private prisma: PrismaClient) {}

  async list(request: FastifyRequest, reply: FastifyReply) {
    const { isActive } = request.query as any;
    const where = isActive !== undefined ? { isActive: isActive === 'true' } : {};
    
    const services = await this.prisma.service.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return reply.send(services);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const result = serviceCreateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: { message: result.error.issues.map(i => i.message).join(', ') }
      });
    }

    const service = await this.prisma.service.create({
      data: result.data,
    });

    return reply.status(201).send(service);
  }

  async get(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundError('Serviço não encontrado');
    
    return reply.send(service);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = serviceUpdateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: { message: result.error.issues.map(i => i.message).join(', ') }
      });
    }

    const service = await this.prisma.service.update({
      where: { id },
      data: result.data,
    });

    return reply.send(service);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await this.prisma.service.delete({ where: { id } });
    return reply.status(204).send();
  }
}
