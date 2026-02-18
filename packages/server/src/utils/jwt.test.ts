import jwt from 'jsonwebtoken';
import { describe, it, expect, vi } from 'vitest';

vi.mock('./config.js', () => ({
  config: {
    jwt: {
      accessSecret: 'test-access-secret',
      refreshSecret: 'test-refresh-secret',
      accessExpiresIn: '1h',
      refreshExpiresIn: '14d',
      refreshMaxAge: 14 * 24 * 60 * 60 * 1000,
    },
  },
}));

import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from './jwt.js';

describe('JWT utils', () => {
  describe('Access Token', () => {
    const payload = { sub: 'user-1', email: 'test@test.com' };

    it('생성 후 검증하면 동일한 payload를 반환한다', () => {
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.email).toBe(payload.email);
    });

    it('잘못된 토큰이면 에러를 throw한다', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('다른 secret으로 서명된 토큰이면 에러를 throw한다', () => {
      const token = jwt.sign(payload, 'wrong-secret', { algorithm: 'HS256' });
      expect(() => verifyAccessToken(token)).toThrow();
    });
  });

  describe('Refresh Token', () => {
    const payload = { sub: 'user-1', tokenId: 'token-1' };

    it('생성 후 검증하면 동일한 payload를 반환한다', () => {
      const token = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.tokenId).toBe(payload.tokenId);
    });

    it('잘못된 토큰이면 에러를 throw한다', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });

    it('다른 secret으로 서명된 토큰이면 에러를 throw한다', () => {
      const token = jwt.sign(payload, 'wrong-secret', { algorithm: 'HS256' });
      expect(() => verifyRefreshToken(token)).toThrow();
    });
  });
});
