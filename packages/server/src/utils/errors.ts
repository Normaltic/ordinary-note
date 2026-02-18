import { ErrorCode } from '@ordinary-note/shared';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(code: string = ErrorCode.AUTH_INVALID_TOKEN, message: string = 'Unauthorized') {
    super(401, code, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, ErrorCode.RESOURCE_NOT_FOUND, `${resource} not found`);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super(403, ErrorCode.RESOURCE_FORBIDDEN, 'Access denied');
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super(400, ErrorCode.VALIDATION_FAILED, 'Invalid request', details);
  }
}
