import { createHash } from 'node:crypto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from '@ordinary-note/shared';
import { OAuthService } from './oauth.service.js';
import {
  createMockOAuthClientRepo,
  createMockOAuthCodeRepo,
  createMockAuthService,
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

describe('OAuthService', () => {
  let service: OAuthService;
  let mockClientRepo: ReturnType<typeof createMockOAuthClientRepo>;
  let mockCodeRepo: ReturnType<typeof createMockOAuthCodeRepo>;
  let mockAuthService: ReturnType<typeof createMockAuthService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClientRepo = createMockOAuthClientRepo();
    mockCodeRepo = createMockOAuthCodeRepo();
    mockAuthService = createMockAuthService();
    service = new OAuthService(
      mockClientRepo as never,
      mockCodeRepo as never,
      mockAuthService as never,
    );
  });

  // ── registerClient ───────────────────────────────────────────────

  describe('registerClient', () => {
    it('성공: 유효한 redirect_uri로 클라이언트 등록', async () => {
      mockClientRepo.create.mockResolvedValue(
        fixtures.oauthClient(),
      );

      const result = await service.registerClient({
        redirect_uris: ['http://localhost:3000/callback'],
        client_name: 'Test Client',
      });

      expect(result.client_id).toBeDefined();
      expect(result.redirect_uris).toEqual(['http://localhost:3000/callback']);
      expect(result.client_name).toBe('Test Client');
      expect(mockClientRepo.create).toHaveBeenCalledOnce();
    });

    it('성공: HTTPS redirect_uri 허용', async () => {
      mockClientRepo.create.mockResolvedValue(
        fixtures.oauthClient({
          redirectUris: JSON.stringify(['https://example.com/callback']),
        }),
      );

      const result = await service.registerClient({
        redirect_uris: ['https://example.com/callback'],
      });

      expect(result.client_id).toBeDefined();
    });

    it('실패: redirect_uris 비어있음', async () => {
      await expect(
        service.registerClient({ redirect_uris: [] }),
      ).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_FAILED,
      });
    });

    it('실패: HTTP (non-localhost) redirect_uri 거부', async () => {
      await expect(
        service.registerClient({
          redirect_uris: ['http://example.com/callback'],
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_FAILED,
      });
    });

    it('실패: 잘못된 URL', async () => {
      await expect(
        service.registerClient({
          redirect_uris: ['not-a-url'],
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_FAILED,
      });
    });

    it('실패: credential 포함 URL 거부', async () => {
      await expect(
        service.registerClient({
          redirect_uris: ['https://user:pass@example.com/callback'],
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_FAILED,
      });
    });
  });

  // ── authorize session ────────────────────────────────────────────

  describe('createAuthorizeSession / getAuthorizeSession', () => {
    it('성공: 세션 생성 후 조회', () => {
      const sessionKey = service.createAuthorizeSession({
        clientId: 'client-1',
        redirectUri: 'http://localhost:3000/callback',
        codeChallenge: 'challenge',
        codeChallengeMethod: 'S256',
        state: 'some-state',
      });

      expect(sessionKey).toBeDefined();
      expect(typeof sessionKey).toBe('string');

      const session = service.getAuthorizeSession(sessionKey);
      expect(session).toEqual({
        clientId: 'client-1',
        redirectUri: 'http://localhost:3000/callback',
        codeChallenge: 'challenge',
        codeChallengeMethod: 'S256',
        state: 'some-state',
        createdAt: expect.any(Number),
      });
    });

    it('일회용: 조회 후 재조회 시 null', () => {
      const sessionKey = service.createAuthorizeSession({
        clientId: 'client-1',
        redirectUri: 'http://localhost:3000/callback',
        codeChallenge: 'challenge',
        codeChallengeMethod: 'S256',
      });

      service.getAuthorizeSession(sessionKey);
      const secondGet = service.getAuthorizeSession(sessionKey);
      expect(secondGet).toBeNull();
    });

    it('만료된 세션 → null', () => {
      const sessionKey = service.createAuthorizeSession({
        clientId: 'client-1',
        redirectUri: 'http://localhost:3000/callback',
        codeChallenge: 'challenge',
        codeChallengeMethod: 'S256',
      });

      // Manually expire the session
      vi.spyOn(Date, 'now').mockReturnValue(
        Date.now() + 6 * 60 * 1000, // 6 minutes later
      );

      const session = service.getAuthorizeSession(sessionKey);
      expect(session).toBeNull();

      vi.restoreAllMocks();
    });

    it('존재하지 않는 세션 → null', () => {
      const session = service.getAuthorizeSession('nonexistent');
      expect(session).toBeNull();
    });
  });

  // ── validateAuthorizeParams ──────────────────────────────────────

  describe('validateAuthorizeParams', () => {
    it('성공: 유효한 파라미터', async () => {
      mockClientRepo.findByClientId.mockResolvedValue(fixtures.oauthClient());

      await expect(
        service.validateAuthorizeParams({
          clientId: 'test-client-id-hex',
          redirectUri: 'http://localhost:3000/callback',
          codeChallenge: 'challenge',
          codeChallengeMethod: 'S256',
        }),
      ).resolves.toBeUndefined();
    });

    it('실패: 존재하지 않는 client_id', async () => {
      mockClientRepo.findByClientId.mockResolvedValue(null);

      await expect(
        service.validateAuthorizeParams({
          clientId: 'unknown',
          redirectUri: 'http://localhost:3000/callback',
          codeChallenge: 'challenge',
          codeChallengeMethod: 'S256',
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.AUTH_OAUTH_INVALID_CLIENT,
      });
    });

    it('실패: 등록되지 않은 redirect_uri', async () => {
      mockClientRepo.findByClientId.mockResolvedValue(fixtures.oauthClient());

      await expect(
        service.validateAuthorizeParams({
          clientId: 'test-client-id-hex',
          redirectUri: 'http://localhost:9999/wrong',
          codeChallenge: 'challenge',
          codeChallengeMethod: 'S256',
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.AUTH_OAUTH_INVALID_REDIRECT,
      });
    });
  });

  // ── createAuthorizationCode ──────────────────────────────────────

  describe('createAuthorizationCode', () => {
    it('성공: raw code 반환', async () => {
      mockCodeRepo.create.mockResolvedValue(fixtures.oauthCode());

      const code = await service.createAuthorizationCode({
        clientId: 'client-1',
        userId: 'user-1',
        redirectUri: 'http://localhost:3000/callback',
        codeChallenge: 'challenge',
        codeChallengeMethod: 'S256',
      });

      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
      expect(code.length).toBe(64); // 32 bytes hex
      expect(mockCodeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 'client-1',
          userId: 'user-1',
          redirectUri: 'http://localhost:3000/callback',
          codeChallenge: 'challenge',
          codeChallengeMethod: 'S256',
        }),
      );
    });
  });

  // ── exchangeCode ─────────────────────────────────────────────────

  describe('exchangeCode', () => {
    // Generate a valid PKCE pair
    const codeVerifier = 'a'.repeat(43); // valid verifier (43 chars, all alphanumeric)
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    it('성공: PKCE 검증 통과 후 토큰 발급', async () => {
      const rawCode = 'a'.repeat(64);
      const codeHash = createHash('sha256').update(rawCode).digest('hex');

      mockCodeRepo.findByCodeHash.mockResolvedValue(
        fixtures.oauthCode({
          codeHash,
          codeChallenge,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }),
      );
      mockCodeRepo.markUsed.mockResolvedValue(true);
      mockAuthService.getUserById.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test User',
        profileImage: null,
      });
      mockAuthService.createTokenPair.mockResolvedValue({
        accessToken: 'web-access-token',
        refreshToken: 'refresh-token-123',
      });

      const result = await service.exchangeCode({
        code: rawCode,
        clientId: 'test-client-id-hex',
        redirectUri: 'http://localhost:3000/callback',
        codeVerifier,
      });

      expect(result.token_type).toBe('bearer');
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBe('refresh-token-123');
      expect(result.expires_in).toBe(3600);
    });

    it('실패: 존재하지 않는 code', async () => {
      mockCodeRepo.findByCodeHash.mockResolvedValue(null);

      await expect(
        service.exchangeCode({
          code: 'invalid',
          clientId: 'client-1',
          redirectUri: 'http://localhost:3000/callback',
          codeVerifier,
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.AUTH_OAUTH_INVALID_GRANT,
      });
    });

    it('실패: 만료된 code', async () => {
      mockCodeRepo.findByCodeHash.mockResolvedValue(
        fixtures.oauthCode({
          codeChallenge,
          expiresAt: new Date(Date.now() - 1000),
        }),
      );

      await expect(
        service.exchangeCode({
          code: 'some-code',
          clientId: 'test-client-id-hex',
          redirectUri: 'http://localhost:3000/callback',
          codeVerifier,
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.AUTH_OAUTH_INVALID_GRANT,
      });
    });

    it('실패: 잘못된 code_verifier (PKCE 실패)', async () => {
      const rawCode = 'b'.repeat(64);
      const codeHash = createHash('sha256').update(rawCode).digest('hex');

      mockCodeRepo.findByCodeHash.mockResolvedValue(
        fixtures.oauthCode({
          codeHash,
          codeChallenge,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }),
      );

      await expect(
        service.exchangeCode({
          code: rawCode,
          clientId: 'test-client-id-hex',
          redirectUri: 'http://localhost:3000/callback',
          codeVerifier: 'b'.repeat(43), // different verifier
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.AUTH_OAUTH_INVALID_GRANT,
      });
    });

    it('실패: 이미 사용된 code', async () => {
      const rawCode = 'c'.repeat(64);
      const codeHash = createHash('sha256').update(rawCode).digest('hex');

      mockCodeRepo.findByCodeHash.mockResolvedValue(
        fixtures.oauthCode({
          codeHash,
          codeChallenge,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }),
      );
      mockCodeRepo.markUsed.mockResolvedValue(false); // already used

      await expect(
        service.exchangeCode({
          code: rawCode,
          clientId: 'test-client-id-hex',
          redirectUri: 'http://localhost:3000/callback',
          codeVerifier,
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.AUTH_OAUTH_INVALID_GRANT,
      });
    });

    it('실패: code_verifier 길이 부족 (43자 미만)', async () => {
      await expect(
        service.exchangeCode({
          code: 'some-code',
          clientId: 'client-1',
          redirectUri: 'http://localhost:3000/callback',
          codeVerifier: 'short',
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_FAILED,
      });
    });

    it('실패: client_id 불일치', async () => {
      const rawCode = 'd'.repeat(64);
      const codeHash = createHash('sha256').update(rawCode).digest('hex');

      mockCodeRepo.findByCodeHash.mockResolvedValue(
        fixtures.oauthCode({
          codeHash,
          codeChallenge,
          clientId: 'different-client',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }),
      );

      await expect(
        service.exchangeCode({
          code: rawCode,
          clientId: 'test-client-id-hex',
          redirectUri: 'http://localhost:3000/callback',
          codeVerifier,
        }),
      ).rejects.toMatchObject({
        code: ErrorCode.AUTH_OAUTH_INVALID_GRANT,
      });
    });
  });

  // ── refreshToken ─────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('성공: authService에 위임하고 MCP audience로 재발급', async () => {
      // authService.rotateRefreshToken returns web-audience tokens
      // We need a real JWT-like structure for extractUserFromWebToken
      const { generateAccessToken: genToken } = await import('../utils/jwt.js');
      const webToken = genToken({ sub: 'user-1', email: 'test@test.com' }, 'web');

      mockAuthService.rotateRefreshToken.mockResolvedValue({
        accessToken: webToken,
        refreshToken: 'new-refresh-token',
      });

      const result = await service.refreshToken({
        refreshToken: 'old-refresh-token',
        clientId: 'client-1',
      });

      expect(result.token_type).toBe('bearer');
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBe('new-refresh-token');
      expect(result.expires_in).toBe(3600);
      expect(mockAuthService.rotateRefreshToken).toHaveBeenCalledWith('old-refresh-token');
    });
  });
});
