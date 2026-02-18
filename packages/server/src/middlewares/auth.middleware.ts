import type { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '@ordinary-note/shared';
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError(ErrorCode.AUTH_INVALID_TOKEN, 'Missing or invalid authorization header');
  }

  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new UnauthorizedError(ErrorCode.AUTH_TOKEN_EXPIRED, 'Access token has expired');
  }
}
