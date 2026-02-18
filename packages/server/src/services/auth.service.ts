import { randomUUID, createHash } from 'node:crypto';
import { ErrorCode } from '@ordinary-note/shared';
import type { AuthUser } from '@ordinary-note/shared';
import type {
  UserRepository,
  GoogleProfile,
  RefreshTokenRepository,
} from '../repositories/index.js';
import { config } from '../utils/config.js';
import { verifyGoogleIdToken } from '../utils/google.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async verifyGoogleToken(credential: string): Promise<GoogleProfile> {
    try {
      const payload = await verifyGoogleIdToken(credential);
      if (!payload) {
        throw new UnauthorizedError(
          ErrorCode.AUTH_GOOGLE_FAILED,
          'Invalid Google token',
        );
      }

      return {
        googleId: payload.sub,
        email: payload.email!,
        name: payload.name!,
        profileImage: payload.picture ?? null,
      };
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError(
        ErrorCode.AUTH_GOOGLE_FAILED,
        'Google token verification failed',
      );
    }
  }

  async findOrCreateUser(profile: GoogleProfile) {
    return this.userRepo.upsertByGoogleId(profile);
  }

  async createTokenPair(user: { id: string; email: string }) {
    const familyId = randomUUID();
    const tokenId = randomUUID();

    const refreshTokenJwt = generateRefreshToken({ sub: user.id, tokenId });
    const tokenHash = hashToken(refreshTokenJwt);

    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt: new Date(Date.now() + config.jwt.refreshMaxAge),
    });

    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
    });

    return { accessToken, refreshToken: refreshTokenJwt };
  }

  async rotateRefreshToken(oldTokenJwt: string) {
    let payload;
    try {
      payload = verifyRefreshToken(oldTokenJwt);
    } catch {
      throw new UnauthorizedError(
        ErrorCode.AUTH_REFRESH_INVALID,
        'Invalid refresh token',
      );
    }

    const tokenHash = hashToken(oldTokenJwt);
    const storedToken =
      await this.refreshTokenRepo.findByTokenHashWithUser(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_REFRESH_INVALID,
        'Refresh token not found',
      );
    }

    if (storedToken.revokedAt) {
      // Reuse of revoked token — revoke entire family
      await this.refreshTokenRepo.revokeByFamilyId(storedToken.familyId);
      throw new UnauthorizedError(
        ErrorCode.AUTH_REFRESH_INVALID,
        'Token reuse detected',
      );
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_REFRESH_INVALID,
        'Refresh token expired',
      );
    }

    // Revoke old token
    await this.refreshTokenRepo.revokeById(storedToken.id);

    // Issue new token pair in the same family
    const newTokenId = randomUUID();
    const newRefreshTokenJwt = generateRefreshToken({
      sub: payload.sub,
      tokenId: newTokenId,
    });
    const newTokenHash = hashToken(newRefreshTokenJwt);

    await this.refreshTokenRepo.create({
      userId: storedToken.userId,
      tokenHash: newTokenHash,
      familyId: storedToken.familyId,
      expiresAt: new Date(Date.now() + config.jwt.refreshMaxAge),
    });

    const accessToken = generateAccessToken({
      sub: storedToken.userId,
      email: storedToken.user.email,
    });

    return { accessToken, refreshToken: newRefreshTokenJwt };
  }

  async revokeRefreshToken(tokenJwt: string) {
    const tokenHash = hashToken(tokenJwt);
    const storedToken = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (storedToken) {
      await this.refreshTokenRepo.revokeByFamilyId(storedToken.familyId);
    }
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    const user = await this.userRepo.findById(userId);

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
    };
  }
}
