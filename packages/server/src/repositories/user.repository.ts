import { prisma } from '../utils/prisma.js';

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  profileImage: string | null;
  googleId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  profileImage: string | null;
};

export class UserRepository {
  async findById(id: string): Promise<UserRecord | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async upsertByGoogleId(profile: GoogleProfile): Promise<UserRecord> {
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
}
