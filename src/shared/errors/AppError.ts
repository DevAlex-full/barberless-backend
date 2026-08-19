/**
 * Erro base da aplicação. Todo erro de negócio/domínio deve estender
 * esta classe para que o error handler global consiga traduzi-lo de
 * forma padronizada para a resposta HTTP.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Error.captureStackTrace?.(this, this.constructor);
  }
}
