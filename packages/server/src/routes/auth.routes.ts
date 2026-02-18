import { Router, type Request, type Response } from 'express';
import { ErrorCode } from '@ordinary-note/shared';
import { authenticate } from '../middlewares/auth.middleware.js';
import { config } from '../utils/config.js';
import { UnauthorizedError, NotFoundError, ValidationError } from '../utils/errors.js';
import {
  verifyGoogleToken,
  findOrCreateUser,
  createTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  getUserById,
} from '../services/auth.service.js';

const router: Router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: config.jwt.refreshMaxAge,
};

// POST /api/auth/google
router.post('/google', async (req: Request, res: Response) => {
  const { credential } = req.body;
  if (!credential || typeof credential !== 'string') {
    throw new ValidationError([{ field: 'credential', message: 'credential is required' }]);
  }

  const profile = await verifyGoogleToken(credential);
  const user = await findOrCreateUser(profile);
  const tokens = await createTokenPair({ id: user.id, email: user.email });

  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
  res.json({
    accessToken: tokens.accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
    },
  });
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const oldToken = req.cookies?.refreshToken;
  if (!oldToken) {
    throw new UnauthorizedError(ErrorCode.AUTH_REFRESH_INVALID, 'No refresh token provided');
  }

  const tokens = await rotateRefreshToken(oldToken);

  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
  res.json({ accessToken: tokens.accessToken });
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await revokeRefreshToken(token);
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict' as const,
    path: '/api/auth',
  });
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await getUserById(req.user!.sub);
  if (!user) {
    throw new NotFoundError('User');
  }
  res.json({ user });
});

export { router as authRoutes };
