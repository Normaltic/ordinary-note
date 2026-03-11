import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { ErrorCode } from '@ordinary-note/shared';
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';

const { TokenExpiredError } = jwt;

export function authenticate(audience: string | string[] = 'web') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.setHeader('WWW-Authenticate', 'Bearer');
      throw new UnauthorizedError(
        ErrorCode.AUTH_INVALID_TOKEN,
        'Missing or invalid authorization header',
      );
    }

    const token = header.slice(7);
    try {
      const payload = verifyAccessToken(token, audience);
      req.user = payload;

      const acceptsMcp =
        audience === 'mcp' || (Array.isArray(audience) && audience.includes('mcp'));
      if (acceptsMcp && payload.clientId) {
        req.auth = { token, clientId: payload.clientId, scopes: [] };
      }

      next();
    } catch (error) {
      res.setHeader('WWW-Authenticate', 'Bearer');
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedError(
          ErrorCode.AUTH_TOKEN_EXPIRED,
          'Access token has expired',
        );
      }
      throw new UnauthorizedError(
        ErrorCode.AUTH_INVALID_TOKEN,
        'Invalid access token',
      );
    }
  };
}
