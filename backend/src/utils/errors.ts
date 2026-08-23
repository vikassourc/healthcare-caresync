import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, StatusCodes.NOT_FOUND, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden - Insufficient permissions') {
    super(message, StatusCodes.FORBIDDEN, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, StatusCodes.CONFLICT, 'CONFLICT', details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR', details);
  }
}

export function handleDuplicateKeyError(err: any): ConflictError {
  const field = Object.keys(err.keyValue || {})[0] || 'resource';
  return new ConflictError(`A conflict occurred with ${field}. It is already in use or booked.`, {
    field,
    value: err.keyValue?.[field]
  });
}
