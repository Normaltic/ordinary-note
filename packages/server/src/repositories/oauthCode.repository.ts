import { prisma } from '../utils/prisma.js';

export type OAuthCodeRecord = {
  id: string;
  codeHash: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export type CreateOAuthCodeData = {
  codeHash: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod?: string;
  expiresAt: Date;
};

export class OAuthCodeRepository {
  async create(data: CreateOAuthCodeData): Promise<OAuthCodeRecord> {
    return prisma.oAuthAuthorizationCode.create({ data });
  }

  async findByCodeHash(codeHash: string): Promise<OAuthCodeRecord | null> {
    return prisma.oAuthAuthorizationCode.findUnique({ where: { codeHash } });
  }

  async markUsed(id: string): Promise<boolean> {
    const result = await prisma.oAuthAuthorizationCode.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return result.count > 0;
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.oAuthAuthorizationCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
