import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@/generated/prisma/client';
import { customerCreateSchema, customerUpdateSchema } from './customer.schema';
import { NotFoundError } from '../../shared/errors';

export class CustomerController {
  constructor(private prisma: PrismaClient) {}

  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page = 1, limit = 20, search = '' } = request.query as any;
    
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    } : {};

    const [total, data] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    return reply.send({
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const result = customerCreateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: { message: result.error.issues.map(i => i.message).join(', ') }
      });
    }

    const customer = await this.prisma.customer.create({
      data: result.data,
    });

    return reply.status(201).send(customer);
  }

  async get(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundError('Cliente não encontrado');
    
    return reply.send(customer);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = customerUpdateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: { message: result.error.issues.map(i => i.message).join(', ') }
      });
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: result.data,
    });

    return reply.send(customer);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await this.prisma.customer.delete({ where: { id } });
    return reply.status(204).send();
  }
}
