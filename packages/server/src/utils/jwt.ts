import jwt from 'jsonwebtoken';
import { config } from './config.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  clientId?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

export function generateAccessToken(
  payload: AccessTokenPayload,
  audience: 'web' | 'mcp' = 'web',
): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    algorithm: 'HS256',
    audience,
  });
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(
  token: string,
  audience: string | string[] = 'web',
): AccessTokenPayload {
  const opts: jwt.VerifyOptions = { algorithms: ['HS256'] };
  if (Array.isArray(audience)) {
    opts.audience = audience as [string, ...string[]];
  } else {
    opts.audience = audience;
  }
  return jwt.verify(token, config.jwt.accessSecret, opts) as unknown as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
}
