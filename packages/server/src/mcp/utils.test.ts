import { describe, it, expect, vi } from 'vitest';

vi.mock('../utils/config.js', () => ({
  config: {
    jwt: {
      accessSecret: 'test-access-secret',
      refreshSecret: 'test-refresh-secret',
      accessExpiresIn: '1h',
      refreshExpiresIn: '14d',
      refreshMaxAge: 14 * 24 * 60 * 60 * 1000,
    },
  },
}));

import { getUserId, withErrorHandling, jsonResult } from './utils.js';
import { generateAccessToken } from '../utils/jwt.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

describe('MCP utils', () => {
  describe('getUserId', () => {
    it('유효한 MCP 토큰에서 userId를 추출한다', () => {
      const token = generateAccessToken(
        { sub: 'user-1', email: 'test@test.com' },
        'mcp',
      );
      const userId = getUserId({ token, clientId: 'client-1', scopes: [] });
      expect(userId).toBe('user-1');
    });

    it('authInfo가 없으면 에러를 throw한다', () => {
      expect(() => getUserId(undefined)).toThrow('Missing auth info');
    });

    it('토큰이 없으면 에러를 throw한다', () => {
      expect(() => getUserId({ token: '', clientId: '', scopes: [] })).toThrow(
        'Missing auth info',
      );
    });

    it('잘못된 토큰이면 에러를 throw한다', () => {
      expect(() =>
        getUserId({ token: 'invalid-token', clientId: '', scopes: [] }),
      ).toThrow();
    });

    it('web audience 토큰은 거부한다', () => {
      const token = generateAccessToken(
        { sub: 'user-1', email: 'test@test.com' },
        'web',
      );
      expect(() => getUserId({ token, clientId: '', scopes: [] })).toThrow();
    });
  });

  describe('withErrorHandling', () => {
    it('정상 결과를 반환한다', async () => {
      const result = await withErrorHandling(async () => ({
        content: [{ type: 'text' as const, text: 'ok' }],
      }));
      expect(result.content[0]).toEqual({ type: 'text', text: 'ok' });
      expect(result.isError).toBeUndefined();
    });

    function parseError(result: Awaited<ReturnType<typeof withErrorHandling>>) {
      const { text } = result.content[0] as { type: 'text'; text: string };
      return JSON.parse(text).error;
    }

    it('AppError를 code/message를 담은 구조화 에러로 변환한다', async () => {
      const result = await withErrorHandling(async () => {
        throw new NotFoundError('Note');
      });
      expect(result.isError).toBe(true);
      expect(parseError(result)).toEqual({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Note not found',
      });
    });

    it('AppError의 details를 포함한다', async () => {
      const result = await withErrorHandling(async () => {
        throw new ValidationError('old_content를 찾을 수 없습니다');
      });
      expect(result.isError).toBe(true);
      expect(parseError(result)).toEqual({
        code: 'VALIDATION_FAILED',
        message: 'Invalid request',
        details: 'old_content를 찾을 수 없습니다',
      });
    });

    it('일반 에러는 내부 메시지를 숨기고 SERVER_INTERNAL로 변환한다', async () => {
      const result = await withErrorHandling(async () => {
        throw new Error('db connection lost');
      });
      expect(result.isError).toBe(true);
      expect(parseError(result)).toEqual({
        code: 'SERVER_INTERNAL',
        message: 'Internal server error',
      });
    });

    it('인증 실패는 AUTH 코드로 변환한다', async () => {
      const result = await withErrorHandling(async () => {
        getUserId({ token: 'invalid-token', clientId: '', scopes: [] });
        return jsonResult({});
      });
      expect(parseError(result).code).toBe('AUTH_INVALID_TOKEN');
    });
  });

  describe('jsonResult', () => {
    it('JSON 문자열을 포함한 결과를 반환한다', () => {
      const result = jsonResult({ id: '1', name: 'test' });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: JSON.stringify({ id: '1', name: 'test' }),
      });
    });

    it('배열도 처리한다', () => {
      const result = jsonResult([1, 2, 3]);
      const parsed = JSON.parse(
        (result.content[0] as { type: 'text'; text: string }).text,
      );
      expect(parsed).toEqual([1, 2, 3]);
    });
  });
});
