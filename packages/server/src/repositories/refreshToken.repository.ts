import { prisma } from '../utils/prisma.js';

export type RefreshTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
};

export type RefreshTokenWithUser = RefreshTokenRecord & {
  user: {
    id: string;
    email: string;
    name: string;
    profileImage: string | null;
  };
};

export type CreateRefreshTokenData = {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
};

export class RefreshTokenRepository {
  async create(data: CreateRefreshTokenData): Promise<RefreshTokenRecord> {
    return prisma.refreshToken.create({ data });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async findByTokenHashWithUser(
    tokenHash: string,
  ): Promise<RefreshTokenWithUser | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async revokeById(id: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByFamilyId(familyId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { familyId },
      data: { revokedAt: new Date() },
    });
  }
}
