import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    const body: { code: string; message: string; details?: unknown } = {
      code: err.code,
      message: err.message,
    };
    if (err.details) {
      body.details = err.details;
    }
    res.status(err.statusCode).json({ error: body });
    return;
  }

  logger.error(err, 'Unhandled error');
  res.status(500).json({
    error: {
      code: 'SERVER_INTERNAL',
      message: 'Internal server error',
    },
  });
};
