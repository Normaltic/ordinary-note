import { Router, type Request, type Response } from 'express';
import express from 'express';
import { ErrorCode } from '@ordinary-note/shared';
import type { OAuthService } from '../services/oauth.service.js';
import type { AuthService } from '../services/auth.service.js';
import { config } from '../utils/config.js';
import { renderAuthorizePage } from './oauth.authorize.html.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';

export function createOAuthRoutes(
  oauthService: OAuthService,
  authService: AuthService,
): Router {
  const router = Router();

  // POST /oauth/register — Dynamic Client Registration
  router.post('/register', async (req: Request, res: Response) => {
    const result = await oauthService.registerClient({
      redirect_uris: req.body.redirect_uris,
      client_name: req.body.client_name,
    });

    res.status(201).json(result);
  });

  // GET /oauth/authorize — Authorization endpoint
  router.get('/authorize', async (req: Request, res: Response) => {
    const {
      response_type,
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      state,
    } = req.query;

    if (response_type !== 'code') {
      throw new ValidationError([
        { field: 'response_type', message: 'Only response_type=code is supported' },
      ]);
    }

    if (!client_id || typeof client_id !== 'string') {
      throw new ValidationError([
        { field: 'client_id', message: 'client_id is required' },
      ]);
    }

    if (!redirect_uri || typeof redirect_uri !== 'string') {
      throw new ValidationError([
        { field: 'redirect_uri', message: 'redirect_uri is required' },
      ]);
    }

    if (!code_challenge || typeof code_challenge !== 'string') {
      throw new ValidationError([
        { field: 'code_challenge', message: 'code_challenge is required' },
      ]);
    }

    const method = (code_challenge_method as string) || 'S256';

    // Validate client + redirect_uri
    await oauthService.validateAuthorizeParams({
      clientId: client_id,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      codeChallengeMethod: method,
    });

    // Create in-memory session
    const sessionKey = oauthService.createAuthorizeSession({
      clientId: client_id,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      codeChallengeMethod: method,
      state: state as string | undefined,
    });

    // Render Google login page
    const html = renderAuthorizePage({
      googleClientId: config.google.clientId,
      serverUrl: config.serverUrl,
      sessionKey,
    });

    res
      .setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' https://accounts.google.com/gsi/client 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://accounts.google.com",
        "frame-src https://accounts.google.com",
        "connect-src https://accounts.google.com",
      ].join('; '))
      .type('html')
      .send(html);
  });

  // POST /oauth/callback — Google credential → authorization code
  router.post(
    '/callback',
    express.urlencoded({ extended: false }),
    async (req: Request, res: Response) => {
      const { credential, sessionKey } = req.body;

      if (!sessionKey || typeof sessionKey !== 'string') {
        throw new UnauthorizedError(
          ErrorCode.AUTH_OAUTH_SESSION_EXPIRED,
          'Missing session key',
        );
      }

      if (!credential || typeof credential !== 'string') {
        throw new ValidationError([
          { field: 'credential', message: 'credential is required' },
        ]);
      }

      // Retrieve and consume session (one-time)
      const session = oauthService.getAuthorizeSession(sessionKey);
      if (!session) {
        throw new UnauthorizedError(
          ErrorCode.AUTH_OAUTH_SESSION_EXPIRED,
          'Authorization session expired or invalid',
        );
      }

      // Verify Google credential
      const profile = await authService.verifyGoogleToken(credential);
      const user = await authService.findOrCreateUser(profile);

      // Create authorization code
      const code = await oauthService.createAuthorizationCode({
        clientId: session.clientId,
        userId: user.id,
        redirectUri: session.redirectUri,
        codeChallenge: session.codeChallenge,
        codeChallengeMethod: session.codeChallengeMethod,
      });

      // Redirect back to client
      const redirectUrl = new URL(session.redirectUri);
      redirectUrl.searchParams.set('code', code);
      if (session.state) {
        redirectUrl.searchParams.set('state', session.state);
      }

      res.redirect(redirectUrl.toString());
    },
  );

  // POST /oauth/token — Token exchange
  router.post('/token', async (req: Request, res: Response) => {
    const { grant_type } = req.body;

    if (grant_type === 'authorization_code') {
      const { code, client_id, redirect_uri, code_verifier } = req.body;

      const result = await oauthService.exchangeCode({
        code,
        clientId: client_id,
        redirectUri: redirect_uri,
        codeVerifier: code_verifier,
      });

      res.json(result);
      return;
    }

    if (grant_type === 'refresh_token') {
      const { refresh_token, client_id } = req.body;

      const result = await oauthService.refreshToken({
        refreshToken: refresh_token,
        clientId: client_id,
      });

      res.json(result);
      return;
    }

    throw new ValidationError([
      { field: 'grant_type', message: 'Unsupported grant_type' },
    ]);
  });

  return router;
}
