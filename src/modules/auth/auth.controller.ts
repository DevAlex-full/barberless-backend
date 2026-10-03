import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@/generated/prisma/client';
import { loginSchema, registerSchema } from './auth.schema';
import { UnauthorizedError, ConflictError } from '../../shared/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'barberless-secret-default';
const ACCESS_TOKEN_EXPIRES = '15m';

export class AuthController {
  constructor(private prisma: PrismaClient) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    const result = registerSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: result.error.issues.map(i => i.message).join(', '),
      });
    }

    const { email, password, confirmPassword } = result.data;

    if (password !== confirmPassword) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'As senhas não coincidem',
      });
    }

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictError('Este e-mail já está cadastrado');

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    return reply.status(201).send({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const result = loginSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: result.error.issues.map(i => i.message).join(', '),
      });
    }

    const { email, password } = result.data;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedError('E-mail ou senha inválidos');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedError('E-mail ou senha inválidos');

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );

    return reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  }

  async logout(_request: FastifyRequest, reply: FastifyReply) {
    // JWT is stateless, but we can suggest client-side deletion
    return reply.send({ message: 'Sessão encerrada com sucesso' });
  }
}
