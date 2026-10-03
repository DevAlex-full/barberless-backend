import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@/generated/prisma/client';
import { professionalCreateSchema, professionalUpdateSchema } from './professional.schema';
import { NotFoundError, ConflictError } from '../../shared/errors';

export class ProfessionalController {
  constructor(private prisma: PrismaClient) {}

  async list(request: FastifyRequest, reply: FastifyReply) {
    const { isActive } = request.query as any;
    
    const where = isActive !== undefined ? { isActive: isActive === 'true' } : {};

    const professionals = await this.prisma.professional.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { name: 'asc' },
    });

    return reply.send(professionals);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const result = professionalCreateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: { message: result.error.issues.map(i => i.message).join(', ') }
      });
    }

    // Check if user already has a professional profile
    const exists = await this.prisma.professional.findUnique({ 
      where: { userId: result.data.userId } 
    });
    if (exists) throw new ConflictError('Este usuário já é um profissional cadastrado');

    const professional = await this.prisma.professional.create({
      data: result.data,
    });

    return reply.status(201).send(professional);
  }

  async get(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const professional = await this.prisma.professional.findUnique({ 
      where: { id },
      include: { user: { select: { email: true } } }
    });
    if (!professional) throw new NotFoundError('Profissional não encontrado');
    
    return reply.send(professional);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = professionalUpdateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: { message: result.error.issues.map(i => i.message).join(', ') }
      });
    }

    const professional = await this.prisma.professional.update({
      where: { id },
      data: result.data,
    });

    return reply.send(professional);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await this.prisma.professional.delete({ where: { id } });
    return reply.status(204).send();
  }
}
