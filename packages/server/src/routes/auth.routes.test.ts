import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { ErrorCode } from '@ordinary-note/shared';
import {
  createMockAuthService,
  generateTestAccessToken,
  fixtures,
} from '../testing/helpers.js';

vi.mock('../utils/config.js', () => ({
  config: {
    port: 3001,
    nodeEnv: 'test',
    clientUrl: 'http://localhost:5173',
    google: { clientId: 'test-client-id' },
    jwt: {
      accessSecret: 'test-access-secret',
      refreshSecret: 'test-refresh-secret',
      accessExpiresIn: '1h',
      refreshExpiresIn: '14d',
      refreshMaxAge: 14 * 24 * 60 * 60 * 1000,
    },
  },
}));

import { createApp } from '../app.js';

describe('Auth Routes', () => {
  let mockAuthService: ReturnType<typeof createMockAuthService>;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService = createMockAuthService();
    app = createApp({ authService: mockAuthService as never });
  });

  // ── POST /api/auth/google ───────────────────────────────────────

  describe('POST /api/auth/google', () => {
    it('성공: accessToken + user 반환, Set-Cookie에 refreshToken 포함', async () => {
      const user = fixtures.user();
      const profile = fixtures.googleProfile();
      mockAuthService.verifyGoogleToken.mockResolvedValue(profile);
      mockAuthService.findOrCreateUser.mockResolvedValue(user);
      mockAuthService.createTokenPair.mockResolvedValue({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid-google-credential' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        accessToken: 'access-token-123',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
        },
      });

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('refreshToken=refresh-token-123');
      expect(cookieStr).toContain('HttpOnly');
    });

    it('실패: credential 누락 → 400 VALIDATION_FAILED', async () => {
      const res = await request(app).post('/api/auth/google').send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('실패: credential이 string 아님 → 400 VALIDATION_FAILED', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 123 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('실패: verifyGoogleToken 에러 → 401 AUTH_GOOGLE_FAILED', async () => {
      const { UnauthorizedError } = await import('../utils/errors.js');
      mockAuthService.verifyGoogleToken.mockRejectedValue(
        new UnauthorizedError(
          ErrorCode.AUTH_GOOGLE_FAILED,
          'Google token verification failed',
        ),
      );

      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'invalid-credential' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCode.AUTH_GOOGLE_FAILED);
    });
  });

  // ── POST /api/auth/refresh ──────────────────────────────────────

  describe('POST /api/auth/refresh', () => {
    it('성공: 쿠키의 refreshToken으로 rotation → 새 accessToken + Set-Cookie', async () => {
      mockAuthService.rotateRefreshToken.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=old-refresh-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ accessToken: 'new-access-token' });
      expect(mockAuthService.rotateRefreshToken).toHaveBeenCalledWith(
        'old-refresh-token',
      );

      const cookies = res.headers['set-cookie'];
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('refreshToken=new-refresh-token');
    });

    it('실패: refreshToken 쿠키 없음 → 401 AUTH_REFRESH_INVALID', async () => {
      const res = await request(app).post('/api/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCode.AUTH_REFRESH_INVALID);
    });

    it('실패: rotateRefreshToken 에러 → 401 AUTH_REFRESH_INVALID', async () => {
      const { UnauthorizedError } = await import('../utils/errors.js');
      mockAuthService.rotateRefreshToken.mockRejectedValue(
        new UnauthorizedError(
          ErrorCode.AUTH_REFRESH_INVALID,
          'Invalid refresh token',
        ),
      );

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=bad-token');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCode.AUTH_REFRESH_INVALID);
    });
  });

  // ── POST /api/auth/logout ──────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('성공: 인증 + 쿠키 있음 → revoke + 쿠키 제거', async () => {
      const token = generateTestAccessToken();
      mockAuthService.revokeRefreshToken.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', 'refreshToken=rt-to-revoke');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(mockAuthService.revokeRefreshToken).toHaveBeenCalledWith(
        'rt-to-revoke',
      );

      const cookies = res.headers['set-cookie'];
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('refreshToken=;');
    });

    it('성공: 인증 + 쿠키 없음 → revokeRefreshToken 미호출, 여전히 200', async () => {
      const token = generateTestAccessToken();

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(mockAuthService.revokeRefreshToken).not.toHaveBeenCalled();
    });

    it('실패: Authorization 헤더 없음 → 401 AUTH_INVALID_TOKEN', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCode.AUTH_INVALID_TOKEN);
    });

    it('실패: 유효하지 않은 accessToken → 401 AUTH_TOKEN_EXPIRED', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCode.AUTH_TOKEN_EXPIRED);
    });
  });

  // ── GET /api/auth/me ───────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('성공: 인증 + 유저 존재 → user 반환', async () => {
      const token = generateTestAccessToken();
      const user = fixtures.user();
      mockAuthService.getUserById.mockResolvedValue({
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
      });
      expect(mockAuthService.getUserById).toHaveBeenCalledWith('user-1');
    });

    it('실패: 유저 미존재 → 404 RESOURCE_NOT_FOUND', async () => {
      const token = generateTestAccessToken();
      mockAuthService.getUserById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    });

    it('실패: Authorization 헤더 없음 → 401 AUTH_INVALID_TOKEN', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCode.AUTH_INVALID_TOKEN);
    });

    it('실패: 유효하지 않은 accessToken → 401 AUTH_TOKEN_EXPIRED', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCode.AUTH_TOKEN_EXPIRED);
    });
  });
});
