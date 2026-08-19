import { AppError } from './AppError';

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado.', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
  }
}
