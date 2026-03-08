import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';

export function getUserId(authInfo?: AuthInfo): string {
  if (!authInfo?.token) throw new Error('Missing auth info');
  const payload = verifyAccessToken(authInfo.token, 'mcp');
  return payload.sub;
}

export async function withErrorHandling(
  fn: () => Promise<CallToolResult>,
): Promise<CallToolResult> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AppError) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
    throw e;
  }
}

export function jsonResult(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}
