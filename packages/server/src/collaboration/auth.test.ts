import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { onAuthenticatePayload } from '@hocuspocus/server';
import { createAuthHandler } from './auth.js';
import {
  createMockNoteRepo,
  generateTestAccessToken,
  fixtures,
} from '../testing/helpers.js';

vi.mock('../utils/config.js', () => ({
  config: {
    jwt: {
      accessSecret: 'test-access-secret',
      refreshSecret: 'test-refresh-secret',
      accessExpiresIn: '1h',
      refreshExpiresIn: '14d',
      refreshMaxAge: 14 * 24 * 60 * 60 * 1000,
    },
    google: { clientId: 'test-client-id' },
  },
}));

describe('createAuthHandler', () => {
  let noteRepo: ReturnType<typeof createMockNoteRepo>;
  let onAuthenticate: (
    payload: onAuthenticatePayload,
  ) => Promise<{ userId: string }>;

  beforeEach(() => {
    vi.clearAllMocks();
    noteRepo = createMockNoteRepo();
    onAuthenticate = createAuthHandler(noteRepo as never);
  });

  it('유효한 토큰 + 소유 노트 → userId 반환', async () => {
    const token = generateTestAccessToken();
    noteRepo.findActiveByIdAndUserId.mockResolvedValue(fixtures.note());

    const result = await onAuthenticate({
      token,
      documentName: 'note-1',
    } as onAuthenticatePayload);

    expect(result).toEqual({ userId: 'user-1' });
    expect(noteRepo.findActiveByIdAndUserId).toHaveBeenCalledWith(
      'note-1',
      'user-1',
    );
  });

  it('유효한 토큰 + 노트 없음 → Error', async () => {
    const token = generateTestAccessToken();
    noteRepo.findActiveByIdAndUserId.mockResolvedValue(null);

    await expect(
      onAuthenticate({
        token,
        documentName: 'non-existent',
      } as onAuthenticatePayload),
    ).rejects.toThrow('Unauthorized');
  });

  it('유효한 토큰 + 미소유 노트 → Error', async () => {
    const token = generateTestAccessToken({ sub: 'other-user' });
    noteRepo.findActiveByIdAndUserId.mockResolvedValue(null);

    await expect(
      onAuthenticate({
        token,
        documentName: 'note-1',
      } as onAuthenticatePayload),
    ).rejects.toThrow('Unauthorized');

    expect(noteRepo.findActiveByIdAndUserId).toHaveBeenCalledWith(
      'note-1',
      'other-user',
    );
  });

  it('무효한 토큰 → 에러', async () => {
    await expect(
      onAuthenticate({
        token: 'invalid-token',
        documentName: 'note-1',
      } as onAuthenticatePayload),
    ).rejects.toThrow();
  });
});
