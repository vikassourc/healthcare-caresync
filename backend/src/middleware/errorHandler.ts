import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational AppError (Custom, expected error)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details
      }
    });
    return;
  }

  // MongoDB Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    res.status(StatusCodes.CONFLICT).json({
      success: false,
      error: {
        message: 'A duplicate record conflict occurred in the database.',
        code: 'DUPLICATE_KEY_CONFLICT',
        details: err.keyValue
      }
    });
    return;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const details = Object.keys(err.errors || {}).map((key) => ({
      field: key,
      message: err.errors[key].message
    }));
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: {
        message: 'Schema validation failed',
        code: 'SCHEMA_VALIDATION_ERROR',
        details
      }
    });
    return;
  }

  // Unknown / Unexpected Internal Errors
  logger.error('Unhandled Internal Exception:', {
    message: err.message,
    stack: err.stack,
    name: err.name
  });

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      message: env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message,
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
}
