import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { ForbiddenError, UnauthorizedError } from '../errors';

const JWT_SECRET = process.env.JWT_SECRET || 'barberless-secret-default';

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    role: string;
  };
}

export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader) throw new UnauthorizedError('Token de autenticação ausente');

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    (request as unknown as AuthenticatedRequest).user = { id: decoded.sub, role: decoded.role };
  } catch {
    throw new UnauthorizedError('Token de autenticação inválido ou expirado');
  }
}

export function authorize(roles: string[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = (request as unknown as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenError('Você não tem permissão para acessar este recurso');
    }
  };
}
