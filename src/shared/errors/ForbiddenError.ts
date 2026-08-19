import { AppError } from './AppError';

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso não permitido.', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
  }
}
