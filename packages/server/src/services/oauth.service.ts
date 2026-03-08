import { randomBytes, createHash } from 'node:crypto';
import { ErrorCode } from '@ordinary-note/shared';
import type { OAuthClientRepository } from '../repositories/oauthClient.repository.js';
import type { OAuthCodeRepository } from '../repositories/oauthCode.repository.js';
import type { AuthService } from './auth.service.js';
import { generateAccessToken } from '../utils/jwt.js';
import { config } from '../utils/config.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';

interface AuthorizeSession {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state?: string;
  createdAt: number;
}

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function validateRedirectUri(uri: string): void {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new ValidationError([
      { field: 'redirect_uris', message: `Invalid URL: ${uri}` },
    ]);
  }

  if (parsed.username || parsed.password) {
    throw new ValidationError([
      { field: 'redirect_uris', message: 'URL must not contain credentials' },
    ]);
  }

  const isLocalhost =
    parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

  if (isLocalhost && parsed.protocol === 'http:') {
    return;
  }
  if (parsed.protocol === 'https:') {
    return;
  }

  throw new ValidationError([
    {
      field: 'redirect_uris',
      message: 'Only HTTPS or localhost HTTP redirect URIs are allowed',
    },
  ]);
}

export class OAuthService {
  private readonly authorizeSessions = new Map<string, AuthorizeSession>();

  constructor(
    private readonly clientRepo: OAuthClientRepository,
    private readonly codeRepo: OAuthCodeRepository,
    private readonly authService: AuthService,
  ) {}

  async registerClient(data: {
    redirect_uris: string[];
    client_name?: string;
  }): Promise<{ client_id: string; redirect_uris: string[]; client_name?: string }> {
    if (!data.redirect_uris || data.redirect_uris.length === 0) {
      throw new ValidationError([
        { field: 'redirect_uris', message: 'At least one redirect URI is required' },
      ]);
    }

    for (const uri of data.redirect_uris) {
      validateRedirectUri(uri);
    }

    const clientId = randomBytes(16).toString('hex');

    const record = await this.clientRepo.create({
      clientId,
      redirectUris: JSON.stringify(data.redirect_uris),
      clientName: data.client_name,
    });

    return {
      client_id: record.clientId,
      redirect_uris: data.redirect_uris,
      client_name: record.clientName ?? undefined,
    };
  }

  createAuthorizeSession(params: {
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: string;
    state?: string;
  }): string {
    this.cleanExpiredSessions();

    const sessionKey = randomBytes(32).toString('hex');
    this.authorizeSessions.set(sessionKey, {
      clientId: params.clientId,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      state: params.state,
      createdAt: Date.now(),
    });

    return sessionKey;
  }

  getAuthorizeSession(sessionKey: string): AuthorizeSession | null {
    const session = this.authorizeSessions.get(sessionKey);
    if (!session) return null;

    this.authorizeSessions.delete(sessionKey);

    if (Date.now() - session.createdAt > SESSION_TTL_MS) {
      return null;
    }

    return session;
  }

  async validateAuthorizeParams(params: {
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: string;
  }): Promise<void> {
    const client = await this.clientRepo.findByClientId(params.clientId);
    if (!client) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_OAUTH_INVALID_CLIENT,
        'Unknown client_id',
      );
    }

    const registeredUris: string[] = JSON.parse(client.redirectUris);
    if (!registeredUris.includes(params.redirectUri)) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_OAUTH_INVALID_REDIRECT,
        'redirect_uri does not match registered URIs',
      );
    }

    if (!params.codeChallenge) {
      throw new ValidationError([
        { field: 'code_challenge', message: 'code_challenge is required (PKCE)' },
      ]);
    }

    if (params.codeChallengeMethod !== 'S256') {
      throw new ValidationError([
        { field: 'code_challenge_method', message: 'Only S256 is supported' },
      ]);
    }
  }

  async createAuthorizationCode(params: {
    clientId: string;
    userId: string;
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: string;
  }): Promise<string> {
    const rawCode = randomBytes(32).toString('hex');

    await this.codeRepo.create({
      codeHash: hashCode(rawCode),
      clientId: params.clientId,
      userId: params.userId,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });

    return rawCode;
  }

  async exchangeCode(params: {
    code: string;
    clientId: string;
    redirectUri: string;
    codeVerifier: string;
  }): Promise<{
    access_token: string;
    token_type: 'bearer';
    expires_in: number;
    refresh_token: string;
  }> {
    this.validateCodeVerifier(params.codeVerifier);

    const codeRecord = await this.codeRepo.findByCodeHash(hashCode(params.code));
    if (!codeRecord) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_OAUTH_INVALID_GRANT,
        'Invalid authorization code',
      );
    }

    if (codeRecord.expiresAt < new Date()) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_OAUTH_INVALID_GRANT,
        'Authorization code has expired',
      );
    }

    if (codeRecord.clientId !== params.clientId) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_OAUTH_INVALID_GRANT,
        'client_id mismatch',
      );
    }

    if (codeRecord.redirectUri !== params.redirectUri) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_OAUTH_INVALID_GRANT,
        'redirect_uri mismatch',
      );
    }

    // PKCE verification
    const computedChallenge = createHash('sha256')
      .update(params.codeVerifier)
      .digest('base64url');

    if (computedChallenge !== codeRecord.codeChallenge) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_OAUTH_INVALID_GRANT,
        'PKCE verification failed',
      );
    }

    // Atomic mark-used
    const marked = await this.codeRepo.markUsed(codeRecord.id);
    if (!marked) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_OAUTH_INVALID_GRANT,
        'Authorization code already used',
      );
    }

    // Get user info for token
    const user = await this.authService.getUserById(codeRecord.userId);
    if (!user) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_OAUTH_INVALID_GRANT,
        'User not found',
      );
    }

    // Create refresh token via auth service
    const tokens = await this.authService.createTokenPair({
      id: user.id,
      email: user.email,
    });

    // Re-issue access token with MCP audience + clientId
    const accessToken = generateAccessToken(
      { sub: user.id, email: user.email, clientId: params.clientId },
      'mcp',
    );

    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: tokens.refreshToken,
    };
  }

  async refreshToken(params: {
    refreshToken: string;
    clientId: string;
  }): Promise<{
    access_token: string;
    token_type: 'bearer';
    expires_in: number;
    refresh_token: string;
  }> {
    const tokens = await this.authService.rotateRefreshToken(params.refreshToken);

    // rotateRefreshToken returns web-audience tokens, so we need to
    // extract user info and re-issue with MCP audience
    const user = await this.extractUserFromWebToken(tokens.accessToken);

    const accessToken = generateAccessToken(
      { sub: user.sub, email: user.email, clientId: params.clientId },
      'mcp',
    );

    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: tokens.refreshToken,
    };
  }

  private validateCodeVerifier(verifier: string): void {
    if (verifier.length < 43 || verifier.length > 128) {
      throw new ValidationError([
        { field: 'code_verifier', message: 'code_verifier must be 43-128 characters' },
      ]);
    }

    if (!/^[A-Za-z0-9\-._~]+$/.test(verifier)) {
      throw new ValidationError([
        { field: 'code_verifier', message: 'code_verifier contains invalid characters' },
      ]);
    }
  }

  private extractUserFromWebToken(
    webAccessToken: string,
  ): { sub: string; email: string } {
    // The web access token is a JWT — decode it to get user info
    // We trust this token since we just created it via authService
    const parts = webAccessToken.split('.');
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString(),
    );
    return { sub: payload.sub, email: payload.email };
  }

  private cleanExpiredSessions(): void {
    const now = Date.now();
    for (const [key, session] of this.authorizeSessions) {
      if (now - session.createdAt > SESSION_TTL_MS) {
        this.authorizeSessions.delete(key);
      }
    }
  }
}
