import type { ErrorRequestHandler } from 'express';
import { ErrorCode, OAuthErrorCode } from '@ordinary-note/shared';
import type { OAuthErrorCodeType } from '@ordinary-note/shared';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * RFC 6749 형식의 OAuth 에러 핸들러.
 * MCP 클라이언트가 {"error": "string"} 형식을 기대하므로
 * /oauth 라우트에서는 이 핸들러를 사용한다.
 */
export const oauthErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  if (err instanceof AppError) {
    if (err.statusCode === 401) {
      res.setHeader('WWW-Authenticate', 'Bearer');
    }
    res.status(err.statusCode).json({
      error: mapToOAuthError(err),
      error_description: err.message,
    });
    return;
  }

  logger.error(err, 'Unhandled OAuth error');
  res.status(500).json({
    error: OAuthErrorCode.SERVER_ERROR,
    error_description: 'Internal server error',
  });
};

function mapToOAuthError(err: AppError): OAuthErrorCodeType {
  if (err.code === ErrorCode.AUTH_OAUTH_INVALID_GRANT) {
    return OAuthErrorCode.INVALID_GRANT;
  }
  switch (err.statusCode) {
    case 400:
      return OAuthErrorCode.INVALID_REQUEST;
    case 401:
      return OAuthErrorCode.INVALID_CLIENT;
    case 403:
      return OAuthErrorCode.ACCESS_DENIED;
    default:
      return OAuthErrorCode.SERVER_ERROR;
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    if (err.statusCode === 401) {
      res.setHeader('WWW-Authenticate', 'Bearer');
    }
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
