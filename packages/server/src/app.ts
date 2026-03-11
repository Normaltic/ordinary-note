import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { logger } from './utils/logger.js';
import { config } from './utils/config.js';
import { errorHandler, oauthErrorHandler } from './middlewares/error.middleware.js';
import { rateLimiter } from './middlewares/rateLimit.middleware.js';
import { createRouter, type AppServices } from './routes/index.js';
import { createOAuthRoutes } from './routes/oauth.routes.js';
import { createMcpRoutes } from './mcp/transport.js';
import { createMcpServer } from './mcp/index.js';

export function createApp(services: AppServices): Express {
  const app = express();

  if (config.nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.text({ type: 'text/markdown', limit: '1mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  // ── MCP Routes (Bearer auth, all origins) ──────────────────────
  app.use('/mcp', cors());
  app.use('/mcp', rateLimiter.general);
  app.use(
    '/mcp',
    createMcpRoutes(() =>
      createMcpServer({
        folderService: services.folderService,
        noteService: services.noteService,
        getCollaboration: services.getCollaboration,
      }),
    ),
  );

  // ── CORS (credentials, web origin only) ────────────────────────
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Well-Known ──────────────────────────────────────────────────
  app.get('/.well-known/oauth-authorization-server', (_req, res) => {
    res.json({
      issuer: config.serverUrl,
      authorization_endpoint: `${config.serverUrl}/oauth/authorize`,
      token_endpoint: `${config.serverUrl}/oauth/token`,
      registration_endpoint: `${config.serverUrl}/oauth/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
    });
  });

  // ── Health ──────────────────────────────────────────────────────
  app.get('/api/health', async (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // ── Rate Limiters ───────────────────────────────────────────────
  app.use('/api/auth', rateLimiter.auth);
  app.use('/oauth', rateLimiter.auth);
  app.use('/api', rateLimiter.general);

  // ── OAuth Routes ────────────────────────────────────────────────
  app.use('/oauth', createOAuthRoutes(services.oauthService, services.authService));
  app.use('/oauth', oauthErrorHandler);

  // ── API Routes ──────────────────────────────────────────────────
  app.use('/api', createRouter(services));

  app.use(errorHandler);

  return app;
}
