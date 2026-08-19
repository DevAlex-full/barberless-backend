import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../errors';

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

function buildResponse(
  code: string,
  message: string,
  requestId: string,
  details?: unknown,
): ErrorResponseBody {
  return {
    error: {
      code,
      message,
      requestId,
      ...(details !== undefined ? { details } : {}),
    },
  };
}

/**
 * Error handler global do Fastify. Traduz erros conhecidos (AppError e
 * subclasses, erros de validação Zod, erros nativos do Fastify) em uma
 * resposta HTTP padronizada, sempre incluindo o requestId para
 * correlação com os logs estruturados.
 */
export function errorHandler(
  error: FastifyError | AppError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const requestId = request.id;

  if (error instanceof AppError) {
    request.log.warn({ err: error, requestId }, 'Erro de aplicação tratado');
    reply
      .status(error.statusCode)
      .send(buildResponse(error.code, error.message, requestId, error.details));
    return;
  }

  if (error instanceof ZodError) {
    request.log.warn({ err: error, requestId }, 'Erro de validação');
    reply
      .status(400)
      .send(
        buildResponse(
          'VALIDATION_ERROR',
          'Dados de entrada inválidos.',
          requestId,
          error.flatten(),
        ),
      );
    return;
  }

  const fastifyError = error as FastifyError;
  if (typeof fastifyError.statusCode === 'number' && fastifyError.statusCode < 500) {
    request.log.warn({ err: error, requestId }, 'Erro de requisição');
    reply
      .status(fastifyError.statusCode)
      .send(buildResponse(fastifyError.code ?? 'BAD_REQUEST', fastifyError.message, requestId));
    return;
  }

  request.log.error({ err: error, requestId }, 'Erro interno não tratado');
  reply.status(500).send(buildResponse('INTERNAL_ERROR', 'Erro interno do servidor.', requestId));
}
