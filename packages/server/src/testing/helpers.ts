import { vi } from 'vitest';
import type { UserRecord, GoogleProfile } from '../repositories/user.repository.js';
import type {
  RefreshTokenRecord,
  RefreshTokenWithUser,
} from '../repositories/refreshToken.repository.js';
import type {
  FolderRecord,
  FolderWithCounts,
} from '../repositories/folder.repository.js';
import type { NoteRecord } from '../repositories/note.repository.js';
import type { AuthService } from '../services/auth.service.js';
import type { FolderService } from '../services/folder.service.js';
import type { NoteService } from '../services/note.service.js';
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

export function createMockFolderRepo() {
  return {
    create: vi.fn<(data: unknown) => Promise<FolderRecord>>(),
    findById: vi.fn<(id: string) => Promise<FolderRecord | null>>(),
    update: vi.fn<(id: string, data: unknown) => Promise<FolderRecord>>(),
    delete: vi.fn<(id: string) => Promise<void>>(),
    findAllByUserId: vi.fn<(userId: string) => Promise<FolderWithCounts[]>>(),
    findChildrenByParentId: vi.fn<(userId: string, parentId: string) => Promise<FolderWithCounts[]>>(),
    getMaxSortOrder: vi.fn<(userId: string, parentId: string | null) => Promise<number>>(),
  };
}

export function createMockNoteRepo() {
  return {
    create: vi.fn<(data: unknown) => Promise<NoteRecord>>(),
    findById: vi.fn<(id: string) => Promise<NoteRecord | null>>(),
    findActiveById: vi.fn<(id: string) => Promise<NoteRecord | null>>(),
    update: vi.fn<(id: string, data: unknown) => Promise<NoteRecord>>(),
    findByFolderId: vi.fn<(folderId: string) => Promise<NoteRecord[]>>(),
    softDelete: vi.fn<(id: string) => Promise<void>>(),
    getMaxSortOrder: vi.fn<(folderId: string) => Promise<number>>(),
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

export function createMockFolderService(): {
  [K in keyof FolderService]: ReturnType<typeof vi.fn>;
} {
  return {
    getTree: vi.fn(),
    getChildren: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

export function createMockNoteService(): {
  [K in keyof NoteService]: ReturnType<typeof vi.fn>;
} {
  return {
    getById: vi.fn(),
    getByFolderId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

  folder: (overrides?: Partial<FolderRecord>): FolderRecord => ({
    id: 'folder-1',
    userId: 'user-1',
    parentId: null,
    name: 'My Notes',
    sortOrder: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }),

  folderWithCounts: (
    overrides?: Partial<FolderWithCounts>,
  ): FolderWithCounts => ({
    ...fixtures.folder(),
    _count: { children: 0, notes: 0 },
    ...overrides,
  }),

  note: (overrides?: Partial<NoteRecord>): NoteRecord => ({
    id: 'note-1',
    userId: 'user-1',
    folderId: 'folder-1',
    title: 'Test Note',
    contentPlain: 'Some content',
    contentHtml: null,
    sortOrder: 0,
    isPinned: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null,
    ...overrides,
  }),
};
