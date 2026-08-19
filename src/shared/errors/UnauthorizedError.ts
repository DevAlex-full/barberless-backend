import { AppError } from './AppError';

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autenticado.', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}
