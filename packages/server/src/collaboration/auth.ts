import type { onAuthenticatePayload } from '@hocuspocus/server';
import type { NoteRepository } from '../repositories/index.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

export function createAuthHandler(noteRepo: NoteRepository) {
  return async function onAuthenticate({
    token,
    documentName,
  }: onAuthenticatePayload): Promise<{ userId: string }> {
    const payload = verifyAccessToken(token, 'web');

    const note = await noteRepo.findActiveByIdAndUserId(
      documentName,
      payload.sub,
    );

    if (!note) {
      logger.warn(
        { documentName, userId: payload.sub },
        'Collaboration auth failed: note not found or not owned',
      );
      throw new Error('Unauthorized');
    }

    return { userId: payload.sub };
  };
}
