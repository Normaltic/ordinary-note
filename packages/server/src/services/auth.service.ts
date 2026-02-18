import { randomUUID, createHash } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { ErrorCode } from '@ordinary-note/shared';
import type { AuthUser } from '@ordinary-note/shared';
import { prisma } from '../utils/prisma.js';
import { config } from '../utils/config.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';

const googleClient = new OAuth2Client(config.google.clientId);

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function verifyGoogleToken(credential: string) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.google.clientId,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedError(ErrorCode.AUTH_GOOGLE_FAILED, 'Invalid Google token');
    }

    return {
      googleId: payload.sub,
      email: payload.email!,
      name: payload.name!,
      profileImage: payload.picture ?? null,
    };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError(ErrorCode.AUTH_GOOGLE_FAILED, 'Google token verification failed');
  }
}

export async function findOrCreateUser(profile: {
  googleId: string;
  email: string;
  name: string;
  profileImage: string | null;
}) {
  return prisma.user.upsert({
    where: { googleId: profile.googleId },
    update: {
      email: profile.email,
      name: profile.name,
      profileImage: profile.profileImage,
    },
    create: {
      email: profile.email,
      name: profile.name,
      profileImage: profile.profileImage,
      googleId: profile.googleId,
    },
  });
}

export async function createTokenPair(user: { id: string; email: string }) {
  const familyId = randomUUID();
  const tokenId = randomUUID();

  const refreshTokenJwt = generateRefreshToken({ sub: user.id, tokenId });
  const tokenHash = hashToken(refreshTokenJwt);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt: new Date(Date.now() + config.jwt.refreshMaxAge),
    },
  });

  const accessToken = generateAccessToken({ sub: user.id, email: user.email });

  return { accessToken, refreshToken: refreshTokenJwt };
}

export async function rotateRefreshToken(oldTokenJwt: string) {
  let payload;
  try {
    payload = verifyRefreshToken(oldTokenJwt);
  } catch {
    throw new UnauthorizedError(ErrorCode.AUTH_REFRESH_INVALID, 'Invalid refresh token');
  }

  const tokenHash = hashToken(oldTokenJwt);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedToken) {
    // Token reuse detected — revoke entire family
    // We can only revoke by user since we don't know the familyId
    // Try to find any token for this user to get a familyId hint
    throw new UnauthorizedError(ErrorCode.AUTH_REFRESH_INVALID, 'Refresh token not found');
  }

  if (storedToken.revokedAt) {
    // Reuse of revoked token — revoke entire family
    await prisma.refreshToken.updateMany({
      where: { familyId: storedToken.familyId },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedError(ErrorCode.AUTH_REFRESH_INVALID, 'Token reuse detected');
  }

  if (storedToken.expiresAt < new Date()) {
    throw new UnauthorizedError(ErrorCode.AUTH_REFRESH_INVALID, 'Refresh token expired');
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  // Issue new token pair in the same family
  const newTokenId = randomUUID();
  const newRefreshTokenJwt = generateRefreshToken({
    sub: payload.sub,
    tokenId: newTokenId,
  });
  const newTokenHash = hashToken(newRefreshTokenJwt);

  await prisma.refreshToken.create({
    data: {
      userId: storedToken.userId,
      tokenHash: newTokenHash,
      familyId: storedToken.familyId,
      expiresAt: new Date(Date.now() + config.jwt.refreshMaxAge),
    },
  });

  const accessToken = generateAccessToken({
    sub: storedToken.userId,
    email: storedToken.user.email,
  });

  return { accessToken, refreshToken: newRefreshTokenJwt };
}

export async function revokeRefreshToken(tokenJwt: string) {
  const tokenHash = hashToken(tokenJwt);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (storedToken) {
    await prisma.refreshToken.updateMany({
      where: { familyId: storedToken.familyId },
      data: { revokedAt: new Date() },
    });
  }
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profileImage: user.profileImage,
  };
}
