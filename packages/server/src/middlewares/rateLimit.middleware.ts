import rateLimit from 'express-rate-limit';

export const rateLimiter = {
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: {
      error: {
        code: 'SERVER_RATE_LIMITED',
        message: 'Too many authentication attempts',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  general: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    message: {
      error: {
        code: 'SERVER_RATE_LIMITED',
        message: 'Too many requests',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
};
