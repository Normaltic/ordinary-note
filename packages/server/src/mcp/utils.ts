import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import jwt from 'jsonwebtoken';
import { ErrorCode } from '@ordinary-note/shared';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError, UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const { TokenExpiredError } = jwt;

export function getUserId(authInfo?: AuthInfo): string {
  if (!authInfo?.token) {
    throw new UnauthorizedError(
      ErrorCode.AUTH_INVALID_TOKEN,
      'Missing auth info',
    );
  }
  try {
    return verifyAccessToken(authInfo.token, 'mcp').sub;
  } catch (e) {
    if (e instanceof TokenExpiredError) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_TOKEN_EXPIRED,
        'Access token has expired',
      );
    }
    throw new UnauthorizedError(
      ErrorCode.AUTH_INVALID_TOKEN,
      'Invalid access token',
    );
  }
}

/**
 * 도구 에러를 에이전트가 유형별로 대응할 수 있도록 구조화된 JSON으로 반환한다.
 * { error: { code, message, details? } }
 */
export function errorResult(
  code: string,
  message: string,
  details?: unknown,
): CallToolResult {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: { code, message, details } }, null, 2),
      },
    ],
  };
}

export async function withErrorHandling(
  fn: () => Promise<CallToolResult>,
): Promise<CallToolResult> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AppError) {
      return errorResult(e.code, e.message, e.details);
    }
    logger.error({ err: e }, 'Unexpected MCP tool error');
    return errorResult(ErrorCode.SERVER_INTERNAL, 'Internal server error');
  }
}

export function jsonResult(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}
