import { prisma } from '../utils/prisma.js';

export type OAuthClientRecord = {
  id: string;
  clientId: string;
  clientSecretHash: string | null;
  redirectUris: string;
  clientName: string | null;
  createdAt: Date;
};

export type CreateOAuthClientData = {
  clientId: string;
  redirectUris: string;
  clientName?: string;
};

export class OAuthClientRepository {
  async create(data: CreateOAuthClientData): Promise<OAuthClientRecord> {
    return prisma.oAuthClient.create({ data });
  }

  async findByClientId(clientId: string): Promise<OAuthClientRecord | null> {
    return prisma.oAuthClient.findUnique({ where: { clientId } });
  }
}
