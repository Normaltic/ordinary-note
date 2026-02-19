import { vi } from 'vitest';
import type { UserRecord, GoogleProfile } from '../repositories/user.repository.js';
import type {
  RefreshTokenRecord,
  RefreshTokenWithUser,
} from '../repositories/refreshToken.repository.js';
import type { AuthService } from '../services/auth.service.js';
import { generateAccessToken } from '../utils/jwt.js';
import type { AccessTokenPayload } from '../utils/jwt.js';

// ── Mock Repository Factories ──────────────────────────────────────

export function createMockUserRepo() {
  return {
    findById: vi.fn<(id: string) => Promise<UserRecord | null>>(),
    upsertByGoogleId: vi.fn<(profile: GoogleProfile) => Promise<UserRecord>>(),
  };
}

export function createMockRefreshTokenRepo() {
  return {
    create: vi.fn<(data: unknown) => Promise<RefreshTokenRecord>>(),
    findByTokenHash: vi.fn<(hash: string) => Promise<RefreshTokenRecord | null>>(),
    findByTokenHashWithUser: vi.fn<(hash: string) => Promise<RefreshTokenWithUser | null>>(),
    revokeById: vi.fn<(id: string) => Promise<void>>(),
    revokeByFamilyId: vi.fn<(familyId: string) => Promise<void>>(),
  };
}

// ── Mock AuthService ─────────────────────────────────────────────────

export function createMockAuthService(): {
  [K in keyof AuthService]: ReturnType<typeof vi.fn>;
} {
  return {
    verifyGoogleToken: vi.fn(),
    findOrCreateUser: vi.fn(),
    createTokenPair: vi.fn(),
    rotateRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    getUserById: vi.fn(),
  };
}

// ── Test Token Generator ─────────────────────────────────────────────

export function generateTestAccessToken(
  overrides?: Partial<AccessTokenPayload>,
): string {
  return generateAccessToken({
    sub: 'user-1',
    email: 'test@test.com',
    ...overrides,
  });
}

// ── Fixtures ────────────────────────────────────────────────────────

export const fixtures = {
  user: (overrides?: Partial<UserRecord>): UserRecord => ({
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
    profileImage: 'https://example.com/photo.jpg',
    googleId: 'google-123',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }),

  googleProfile: (overrides?: Partial<GoogleProfile>): GoogleProfile => ({
    googleId: 'google-123',
    email: 'test@test.com',
    name: 'Test User',
    profileImage: 'https://example.com/photo.jpg',
    ...overrides,
  }),

  refreshToken: (overrides?: Partial<RefreshTokenRecord>): RefreshTokenRecord => ({
    id: 'rt-1',
    userId: 'user-1',
    tokenHash: 'hashed-token',
    familyId: 'family-1',
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  }),

  refreshTokenWithUser: (
    overrides?: Partial<RefreshTokenWithUser>,
  ): RefreshTokenWithUser => ({
    ...fixtures.refreshToken(),
    user: {
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
      profileImage: 'https://example.com/photo.jpg',
    },
    ...overrides,
  }),
};
