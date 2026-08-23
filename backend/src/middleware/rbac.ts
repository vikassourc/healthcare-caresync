import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access restricted to role(s): ${allowedRoles.join(', ')}. Your role is ${req.user.role}.`
        )
      );
    }

    next();
  };
}
