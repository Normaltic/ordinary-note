import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { ErrorCode, OAuthErrorCode } from '@ordinary-note/shared';
import {
  createMockAuthService,
  createMockFolderService,
  createMockNoteService,
  createMockOAuthService,
  fixtures,
} from '../testing/helpers.js';

vi.mock('../utils/config.js', () => ({
  config: {
    port: 3001,
    nodeEnv: 'test',
    clientUrl: 'http://localhost:5173',
    serverUrl: 'http://localhost:3001',
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

describe('OAuth Routes', () => {
  let mockOAuthService: ReturnType<typeof createMockOAuthService>;
  let mockAuthService: ReturnType<typeof createMockAuthService>;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOAuthService = createMockOAuthService();
    mockAuthService = createMockAuthService();
    app = createApp({
      authService: mockAuthService as never,
      folderService: createMockFolderService() as never,
      noteService: createMockNoteService() as never,
      oauthService: mockOAuthService as never,
      attachmentService: {} as never,
      getCollaboration: (() => ({})) as never,
    });
  });

  // ── GET /.well-known/oauth-authorization-server ──────────────────

  describe('GET /.well-known/oauth-authorization-server', () => {
    it('성공: OAuth 메타데이터 반환', async () => {
      const res = await request(app).get(
        '/.well-known/oauth-authorization-server',
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        issuer: 'http://localhost:3001',
        authorization_endpoint: 'http://localhost:3001/oauth/authorize',
        token_endpoint: 'http://localhost:3001/oauth/token',
        registration_endpoint: 'http://localhost:3001/oauth/register',
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none'],
      });
    });
  });

  // ── POST /oauth/register ─────────────────────────────────────────

  describe('POST /oauth/register', () => {
    it('성공: 클라이언트 등록', async () => {
      mockOAuthService.registerClient.mockResolvedValue({
        client_id: 'new-client-id',
        redirect_uris: ['http://localhost:3000/callback'],
        client_name: 'Test App',
      });

      const res = await request(app)
        .post('/oauth/register')
        .send({
          redirect_uris: ['http://localhost:3000/callback'],
          client_name: 'Test App',
        });

      expect(res.status).toBe(201);
      expect(res.body.client_id).toBe('new-client-id');
      expect(res.body.redirect_uris).toEqual([
        'http://localhost:3000/callback',
      ]);
    });

    it('실패: 유효하지 않은 redirect_uri → 400', async () => {
      const { ValidationError } = await import('../utils/errors.js');
      mockOAuthService.registerClient.mockRejectedValue(
        new ValidationError([
          {
            field: 'redirect_uris',
            message: 'Only HTTPS or localhost HTTP redirect URIs are allowed',
          },
        ]),
      );

      const res = await request(app)
        .post('/oauth/register')
        .send({ redirect_uris: ['http://example.com/bad'] });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(OAuthErrorCode.INVALID_REQUEST);
    });
  });

  // ── GET /oauth/authorize ──────────────────────────────────────────

  describe('GET /oauth/authorize', () => {
    it('성공: Google 로그인 HTML 렌더링', async () => {
      mockOAuthService.validateAuthorizeParams.mockResolvedValue(undefined);
      mockOAuthService.createAuthorizeSession.mockReturnValue('session-key-123');

      const res = await request(app).get('/oauth/authorize').query({
        response_type: 'code',
        client_id: 'test-client',
        redirect_uri: 'http://localhost:3000/callback',
        code_challenge: 'challenge-value',
        code_challenge_method: 'S256',
        state: 'random-state',
      });

      expect(res.status).toBe(200);
      expect(res.type).toBe('text/html');
      expect(res.text).toContain('Ordinary Note');
      expect(res.text).toContain('session-key-123');
      expect(res.text).toContain('test-client-id'); // Google client ID from config
      expect(mockOAuthService.validateAuthorizeParams).toHaveBeenCalledWith({
        clientId: 'test-client',
        redirectUri: 'http://localhost:3000/callback',
        codeChallenge: 'challenge-value',
        codeChallengeMethod: 'S256',
      });
    });

    it('실패: response_type 누락 → 400', async () => {
      const res = await request(app).get('/oauth/authorize').query({
        client_id: 'test-client',
        redirect_uri: 'http://localhost:3000/callback',
        code_challenge: 'challenge',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(OAuthErrorCode.INVALID_REQUEST);
    });

    it('실패: 존재하지 않는 client_id → 401', async () => {
      const { UnauthorizedError } = await import('../utils/errors.js');
      mockOAuthService.validateAuthorizeParams.mockRejectedValue(
        new UnauthorizedError(
          ErrorCode.AUTH_OAUTH_INVALID_CLIENT,
          'Unknown client_id',
        ),
      );

      const res = await request(app).get('/oauth/authorize').query({
        response_type: 'code',
        client_id: 'unknown',
        redirect_uri: 'http://localhost:3000/callback',
        code_challenge: 'challenge',
        code_challenge_method: 'S256',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe(OAuthErrorCode.INVALID_CLIENT);
    });
  });

  // ── POST /oauth/callback ──────────────────────────────────────────

  describe('POST /oauth/callback', () => {
    it('성공: Google 인증 후 redirect_uri로 code와 state 전달', async () => {
      const profile = fixtures.googleProfile();
      const user = fixtures.user();

      mockOAuthService.getAuthorizeSession.mockReturnValue({
        clientId: 'test-client',
        redirectUri: 'http://localhost:3000/callback',
        codeChallenge: 'challenge',
        codeChallengeMethod: 'S256',
        state: 'random-state',
        createdAt: Date.now(),
      });
      mockAuthService.verifyGoogleToken.mockResolvedValue(profile);
      mockAuthService.findOrCreateUser.mockResolvedValue(user);
      mockOAuthService.createAuthorizationCode.mockResolvedValue(
        'auth-code-123',
      );

      const res = await request(app)
        .post('/oauth/callback')
        .type('form')
        .send('sessionKey=session-key&credential=google-credential');

      expect(res.status).toBe(302);
      const location = res.headers.location;
      expect(location).toContain('http://localhost:3000/callback');
      expect(location).toContain('code=auth-code-123');
      expect(location).toContain('state=random-state');
    });

    it('실패: 세션 없음 → 401', async () => {
      mockOAuthService.getAuthorizeSession.mockReturnValue(null);

      const res = await request(app)
        .post('/oauth/callback')
        .type('form')
        .send('sessionKey=bad-key&credential=some-credential');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe(OAuthErrorCode.INVALID_CLIENT);
    });

    it('실패: credential 누락 → 400', async () => {
      const res = await request(app)
        .post('/oauth/callback')
        .type('form')
        .send('sessionKey=some-key');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(OAuthErrorCode.INVALID_REQUEST);
    });
  });

  // ── POST /oauth/token ─────────────────────────────────────────────

  describe('POST /oauth/token', () => {
    it('성공: authorization_code grant → 토큰 반환', async () => {
      mockOAuthService.exchangeCode.mockResolvedValue({
        access_token: 'mcp-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'refresh-token',
      });

      const res = await request(app).post('/oauth/token').send({
        grant_type: 'authorization_code',
        code: 'auth-code',
        client_id: 'test-client',
        redirect_uri: 'http://localhost:3000/callback',
        code_verifier: 'a'.repeat(43),
      });

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBe('mcp-access-token');
      expect(res.body.token_type).toBe('bearer');
      expect(res.body.expires_in).toBe(3600);
      expect(res.body.refresh_token).toBe('refresh-token');
    });

    it('성공: refresh_token grant → 새 토큰 반환', async () => {
      mockOAuthService.refreshToken.mockResolvedValue({
        access_token: 'new-mcp-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'new-refresh-token',
      });

      const res = await request(app).post('/oauth/token').send({
        grant_type: 'refresh_token',
        refresh_token: 'old-refresh-token',
        client_id: 'test-client',
      });

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBe('new-mcp-token');
      expect(res.body.refresh_token).toBe('new-refresh-token');
    });

    it('실패: 지원하지 않는 grant_type → 400', async () => {
      const res = await request(app).post('/oauth/token').send({
        grant_type: 'client_credentials',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(OAuthErrorCode.INVALID_REQUEST);
    });

    it('실패: 잘못된 code → 401', async () => {
      const { UnauthorizedError } = await import('../utils/errors.js');
      mockOAuthService.exchangeCode.mockRejectedValue(
        new UnauthorizedError(
          ErrorCode.AUTH_OAUTH_INVALID_GRANT,
          'Invalid authorization code',
        ),
      );

      const res = await request(app).post('/oauth/token').send({
        grant_type: 'authorization_code',
        code: 'bad-code',
        client_id: 'test-client',
        redirect_uri: 'http://localhost:3000/callback',
        code_verifier: 'a'.repeat(43),
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe(OAuthErrorCode.INVALID_GRANT);
    });
  });
});
