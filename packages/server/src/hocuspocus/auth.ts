import type { onAuthenticatePayload } from '@hocuspocus/server';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

export async function onAuthenticate({
  token,
  documentName,
}: onAuthenticatePayload): Promise<{ userId: string }> {
  const payload = verifyAccessToken(token);

  const note = await prisma.note.findFirst({
    where: { id: documentName, userId: payload.sub, deletedAt: null },
    select: { id: true },
  });

  if (!note) {
    logger.warn({ documentName, userId: payload.sub }, 'Collaboration auth failed: note not found or not owned');
    throw new Error('Unauthorized');
  }

  return { userId: payload.sub };
}
