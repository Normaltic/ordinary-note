import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from '@ordinary-note/shared';
import {
  createMockUserRepo,
  createMockRefreshTokenRepo,
  fixtures,
} from '../testing/helpers.js';
import { UnauthorizedError } from '../utils/errors.js';

vi.mock('../utils/config.js', () => ({
  config: {
    jwt: {
      accessSecret: 'test-access-secret',
      refreshSecret: 'test-refresh-secret',
      accessExpiresIn: '1h',
      refreshExpiresIn: '14d',
      refreshMaxAge: 14 * 24 * 60 * 60 * 1000,
    },
    google: { clientId: 'test-client-id' },
  },
}));

vi.mock('../utils/google.js', () => ({
  verifyGoogleIdToken: vi.fn(),
}));

import { verifyGoogleIdToken } from '../utils/google.js';
import { verifyRefreshToken, generateRefreshToken } from '../utils/jwt.js';
import { AuthService } from './auth.service.js';

const mockedVerifyGoogle = vi.mocked(verifyGoogleIdToken);

describe('AuthService', () => {
  let userRepo: ReturnType<typeof createMockUserRepo>;
  let refreshTokenRepo: ReturnType<typeof createMockRefreshTokenRepo>;
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    userRepo = createMockUserRepo();
    refreshTokenRepo = createMockRefreshTokenRepo();
    authService = new AuthService(userRepo, refreshTokenRepo);
  });

  // ── verifyGoogleToken ─────────────────────────────────────────

  describe('verifyGoogleToken', () => {
    it('유효한 credential이면 GoogleProfile을 반환한다', async () => {
      mockedVerifyGoogle.mockResolvedValue({
        iss: 'https://accounts.google.com',
        sub: 'google-123',
        aud: 'test-client-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        email: 'test@test.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
      });

      const result = await authService.verifyGoogleToken('valid-credential');

      expect(result).toEqual(fixtures.googleProfile());
    });

    it('payload가 null이면 UnauthorizedError를 throw한다', async () => {
      mockedVerifyGoogle.mockResolvedValue(undefined);

      await expect(authService.verifyGoogleToken('bad')).rejects.toThrow(
        UnauthorizedError,
      );
      await expect(authService.verifyGoogleToken('bad')).rejects.toMatchObject({
        code: ErrorCode.AUTH_GOOGLE_FAILED,
      });
    });

    it('Google 검증 에러가 발생하면 UnauthorizedError를 throw한다', async () => {
      mockedVerifyGoogle.mockRejectedValue(new Error('network error'));

      await expect(authService.verifyGoogleToken('bad')).rejects.toThrow(
        UnauthorizedError,
      );
      await expect(authService.verifyGoogleToken('bad')).rejects.toMatchObject({
        code: ErrorCode.AUTH_GOOGLE_FAILED,
      });
    });
  });

  // ── findOrCreateUser ──────────────────────────────────────────

  describe('findOrCreateUser', () => {
    it('userRepo.upsertByGoogleId를 호출한다', async () => {
      const profile = fixtures.googleProfile();
      const user = fixtures.user();
      userRepo.upsertByGoogleId.mockResolvedValue(user);

      const result = await authService.findOrCreateUser(profile);

      expect(userRepo.upsertByGoogleId).toHaveBeenCalledWith(profile);
      expect(result).toBe(user);
    });
  });

  // ── createTokenPair ───────────────────────────────────────────

  describe('createTokenPair', () => {
    it('refresh token을 저장하고 access/refresh 토큰 쌍을 반환한다', async () => {
      refreshTokenRepo.create.mockResolvedValue(fixtures.refreshToken());

      const result = await authService.createTokenPair({
        id: 'user-1',
        email: 'test@test.com',
      });

      expect(refreshTokenRepo.create).toHaveBeenCalledOnce();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');

      const decoded = verifyRefreshToken(result.refreshToken);
      expect(decoded.sub).toBe('user-1');
    });
  });

  // ── rotateRefreshToken ────────────────────────────────────────

  describe('rotateRefreshToken', () => {
    function createValidRefreshToken() {
      return generateRefreshToken({ sub: 'user-1', tokenId: 'token-1' });
    }

    it('기존 토큰을 revoke하고 같은 familyId로 새 토큰을 발급한다', async () => {
      const oldToken = createValidRefreshToken();
      const storedToken = fixtures.refreshTokenWithUser();

      refreshTokenRepo.findByTokenHashWithUser.mockResolvedValue(storedToken);
      refreshTokenRepo.revokeById.mockResolvedValue(undefined);
      refreshTokenRepo.create.mockResolvedValue(fixtures.refreshToken());

      const result = await authService.rotateRefreshToken(oldToken);

      expect(refreshTokenRepo.revokeById).toHaveBeenCalledWith(storedToken.id);
      expect(refreshTokenRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ familyId: storedToken.familyId }),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('JWT 검증이 실패하면 UnauthorizedError를 throw한다', async () => {
      await expect(
        authService.rotateRefreshToken('invalid-jwt'),
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        authService.rotateRefreshToken('invalid-jwt'),
      ).rejects.toMatchObject({ code: ErrorCode.AUTH_REFRESH_INVALID });
    });

    it('DB에 토큰이 없으면 UnauthorizedError를 throw한다', async () => {
      const oldToken = createValidRefreshToken();
      refreshTokenRepo.findByTokenHashWithUser.mockResolvedValue(null);

      await expect(authService.rotateRefreshToken(oldToken)).rejects.toThrow(
        UnauthorizedError,
      );
      await expect(
        authService.rotateRefreshToken(oldToken),
      ).rejects.toMatchObject({ code: ErrorCode.AUTH_REFRESH_INVALID });
    });

    it('revoke된 토큰을 재사용하면 패밀리 전체를 revoke하고 에러를 throw한다', async () => {
      const oldToken = createValidRefreshToken();
      const revokedToken = fixtures.refreshTokenWithUser({
        revokedAt: new Date(),
      });

      refreshTokenRepo.findByTokenHashWithUser.mockResolvedValue(revokedToken);
      refreshTokenRepo.revokeByFamilyId.mockResolvedValue(undefined);

      await expect(authService.rotateRefreshToken(oldToken)).rejects.toThrow(
        UnauthorizedError,
      );
      expect(refreshTokenRepo.revokeByFamilyId).toHaveBeenCalledWith(
        revokedToken.familyId,
      );
    });

    it('만료된 토큰이면 UnauthorizedError를 throw한다', async () => {
      const oldToken = createValidRefreshToken();
      const expiredToken = fixtures.refreshTokenWithUser({
        expiresAt: new Date(Date.now() - 1000),
      });

      refreshTokenRepo.findByTokenHashWithUser.mockResolvedValue(expiredToken);

      await expect(authService.rotateRefreshToken(oldToken)).rejects.toThrow(
        UnauthorizedError,
      );
      await expect(
        authService.rotateRefreshToken(oldToken),
      ).rejects.toMatchObject({ code: ErrorCode.AUTH_REFRESH_INVALID });
    });
  });

  // ── revokeRefreshToken ────────────────────────────────────────

  describe('revokeRefreshToken', () => {
    it('토큰이 존재하면 패밀리 전체를 revoke한다', async () => {
      const stored = fixtures.refreshToken();
      refreshTokenRepo.findByTokenHash.mockResolvedValue(stored);
      refreshTokenRepo.revokeByFamilyId.mockResolvedValue(undefined);

      await authService.revokeRefreshToken('some-jwt');

      expect(refreshTokenRepo.revokeByFamilyId).toHaveBeenCalledWith(
        stored.familyId,
      );
    });

    it('토큰이 존재하지 않으면 에러 없이 종료한다', async () => {
      refreshTokenRepo.findByTokenHash.mockResolvedValue(null);

      await expect(
        authService.revokeRefreshToken('some-jwt'),
      ).resolves.toBeUndefined();
    });
  });

  // ── getUserById ───────────────────────────────────────────────

  describe('getUserById', () => {
    it('유저가 존재하면 AuthUser를 반환한다', async () => {
      const user = fixtures.user();
      userRepo.findById.mockResolvedValue(user);

      const result = await authService.getUserById('user-1');

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
      });
    });

    it('유저가 존재하지 않으면 null을 반환한다', async () => {
      userRepo.findById.mockResolvedValue(null);

      const result = await authService.getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
