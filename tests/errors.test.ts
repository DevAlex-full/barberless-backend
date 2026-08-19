import { describe, expect, it, vi } from 'vitest';
import { ZodError, z } from 'zod';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../src/shared/errors';
import { errorHandler } from '../src/shared/http/errorHandler';

function fakeReply() {
  const reply: {
    statusCode?: number;
    body?: unknown;
    status: (c: number) => typeof reply;
    send: (b: unknown) => typeof reply;
  } = {
    status(code: number) {
      reply.statusCode = code;
      return reply;
    },
    send(body: unknown) {
      reply.body = body;
      return reply;
    },
  };
  return reply;
}

function fakeRequest(id = 'req-1') {
  return {
    id,
    log: { warn: vi.fn(), error: vi.fn() },
  };
}

describe('classes de erro', () => {
  it('AppError expõe statusCode e code padrão', () => {
    const error = new AppError('falhou');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
  });

  it('NotFoundError usa 404', () => {
    expect(new NotFoundError().statusCode).toBe(404);
  });

  it('ConflictError usa 409', () => {
    expect(new ConflictError().statusCode).toBe(409);
  });

  it('UnauthorizedError usa 401', () => {
    expect(new UnauthorizedError().statusCode).toBe(401);
  });

  it('ForbiddenError usa 403', () => {
    expect(new ForbiddenError().statusCode).toBe(403);
  });
});

describe('errorHandler', () => {
  it('traduz AppError para resposta padronizada com requestId', () => {
    const request = fakeRequest('abc-123');
    const reply = fakeReply();

    errorHandler(new NotFoundError('não achado'), request as never, reply as never);

    expect(reply.statusCode).toBe(404);
    expect((reply.body as { error: { requestId: string } }).error.requestId).toBe('abc-123');
  });

  it('traduz ZodError para 400 VALIDATION_ERROR', () => {
    const request = fakeRequest();
    const reply = fakeReply();

    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({});
    const zodError = result.success ? undefined : (result.error as ZodError);

    errorHandler(zodError as ZodError, request as never, reply as never);

    expect(reply.statusCode).toBe(400);
    expect((reply.body as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');
  });

  it('erros desconhecidos caem em 500 INTERNAL_ERROR', () => {
    const request = fakeRequest();
    const reply = fakeReply();

    errorHandler(new Error('boom'), request as never, reply as never);

    expect(reply.statusCode).toBe(500);
    expect((reply.body as { error: { code: string } }).error.code).toBe('INTERNAL_ERROR');
  });
});
