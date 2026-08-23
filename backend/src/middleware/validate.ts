import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export function validate(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return next(new ValidationError('Invalid request payload', errorMessages));
      }
      next(error);
    }
  };
}
