import type { FastifyReply, FastifyRequest } from 'fastify';

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply): void {
  reply.status(404).send({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Rota ${request.method} ${request.url} não existe.`,
      requestId: request.id,
    },
  });
}
