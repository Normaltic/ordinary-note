import { vi } from 'vitest';
import type {
  UserRecord,
  GoogleProfile,
} from '../repositories/user.repository.js';
import type {
  RefreshTokenRecord,
  RefreshTokenWithUser,
} from '../repositories/refreshToken.repository.js';
import type {
  FolderRecord,
  FolderWithCounts,
} from '../repositories/folder.repository.js';
import type { NoteRecord } from '../repositories/note.repository.js';
import type {
  YjsDocumentWithUpdates,
  YjsDocumentMeta,
} from '../repositories/yjs.repository.js';
import type { OAuthClientRecord } from '../repositories/oauthClient.repository.js';
import type { OAuthCodeRecord } from '../repositories/oauthCode.repository.js';
import type { CollaborationServer } from '../collaboration/index.js';
import type { AuthService } from '../services/auth.service.js';
import type { FolderService } from '../services/folder.service.js';
import type { NoteService } from '../services/note.service.js';
import type { OAuthService } from '../services/oauth.service.js';
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
    findByTokenHash:
      vi.fn<(hash: string) => Promise<RefreshTokenRecord | null>>(),
    findByTokenHashWithUser:
      vi.fn<(hash: string) => Promise<RefreshTokenWithUser | null>>(),
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
    findDescendantIds: vi.fn<(folderId: string) => Promise<string[]>>(),
    findRootId: vi.fn<(folderId: string) => Promise<string>>(),
    findAllByUserId: vi.fn<(userId: string) => Promise<FolderWithCounts[]>>(),
    findChildrenByParentId:
      vi.fn<
        (userId: string, parentId: string) => Promise<FolderWithCounts[]>
      >(),
    getMaxSortOrder:
      vi.fn<(userId: string, parentId: string | null) => Promise<number>>(),
  };
}

export function createMockNoteRepo() {
  return {
    create: vi.fn<(data: unknown) => Promise<NoteRecord>>(),
    findById: vi.fn<(id: string) => Promise<NoteRecord | null>>(),
    findActiveById: vi.fn<(id: string) => Promise<NoteRecord | null>>(),
    findActiveByIdAndUserId:
      vi.fn<(id: string, userId: string) => Promise<NoteRecord | null>>(),
    update: vi.fn<(id: string, data: unknown) => Promise<NoteRecord>>(),
    updateContentPlain:
      vi.fn<(id: string, contentPlain: string) => Promise<void>>(),
    findByFolderId: vi.fn<(folderId: string) => Promise<NoteRecord[]>>(),
    softDelete: vi.fn<(id: string) => Promise<void>>(),
    softDeleteAndMoveByFolderIds:
      vi.fn<
        (folderIds: string[], targetFolderId: string) => Promise<void>
      >(),
    getMaxSortOrder: vi.fn<(folderId: string) => Promise<number>>(),
    searchByContent:
      vi.fn<
        (userId: string, query: string, limit?: number) => Promise<NoteRecord[]>
      >(),
    findRecent:
      vi.fn<(userId: string, limit?: number) => Promise<NoteRecord[]>>(),
    findPinned:
      vi.fn<(userId: string, limit?: number) => Promise<NoteRecord[]>>(),
    findDeleted:
      vi.fn<(userId: string, limit?: number) => Promise<NoteRecord[]>>(),
    findDeletedById:
      vi.fn<(id: string) => Promise<NoteRecord | null>>(),
    restore:
      vi.fn<(id: string, folderId?: string) => Promise<NoteRecord>>(),
    permanentDelete: vi.fn<(id: string) => Promise<void>>(),
    permanentDeleteAllByUserId:
      vi.fn<(userId: string) => Promise<void>>(),
  };
}

export function createMockYjsRepo() {
  return {
    findDocumentWithUpdates:
      vi.fn<(noteId: string) => Promise<YjsDocumentWithUpdates | null>>(),
    findDocumentMeta:
      vi.fn<(noteId: string) => Promise<YjsDocumentMeta | null>>(),
    createUpdate:
      vi.fn<
        (
          yjsDocumentId: string,
          update: Uint8Array,
          stateVector: Uint8Array,
        ) => Promise<void>
      >(),
    countUpdates: vi.fn<(yjsDocumentId: string) => Promise<number>>(),
    compact:
      vi.fn<
        (
          yjsDocumentId: string,
          snapshot: Uint8Array,
          stateVector: Uint8Array,
        ) => Promise<void>
      >(),
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
    search: vi.fn(),
    getRecent: vi.fn(),
    getPinned: vi.fn(),
    getDeleted: vi.fn(),
    restore: vi.fn(),
    permanentDelete: vi.fn(),
    emptyTrash: vi.fn(),
  };
}

// ── Mock Collaboration ──────────────────────────────────────────────

export function createMockCollaboration(): {
  [K in keyof CollaborationServer]: ReturnType<typeof vi.fn>;
} {
  return {
    destroy: vi.fn(),
    openDirectConnection: vi.fn(),
  };
}

// ── OAuth Mock Factories ────────────────────────────────────────────

export function createMockOAuthClientRepo(): {
  create: ReturnType<typeof vi.fn>;
  findByClientId: ReturnType<typeof vi.fn>;
} {
  return {
    create: vi.fn(),
    findByClientId: vi.fn(),
  };
}

export function createMockOAuthCodeRepo(): {
  create: ReturnType<typeof vi.fn>;
  findByCodeHash: ReturnType<typeof vi.fn>;
  markUsed: ReturnType<typeof vi.fn>;
  deleteExpired: ReturnType<typeof vi.fn>;
} {
  return {
    create: vi.fn(),
    findByCodeHash: vi.fn(),
    markUsed: vi.fn(),
    deleteExpired: vi.fn(),
  };
}

export function createMockOAuthService(): {
  [K in keyof OAuthService]: ReturnType<typeof vi.fn>;
} {
  return {
    registerClient: vi.fn(),
    createAuthorizeSession: vi.fn(),
    getAuthorizeSession: vi.fn(),
    validateAuthorizeParams: vi.fn(),
    createAuthorizationCode: vi.fn(),
    exchangeCode: vi.fn(),
    refreshToken: vi.fn(),
  };
}

// ── Test Token Generator ─────────────────────────────────────────────

export function generateTestAccessToken(
  overrides?: Partial<AccessTokenPayload>,
  audience: 'web' | 'mcp' = 'web',
): string {
  return generateAccessToken({
    sub: 'user-1',
    email: 'test@test.com',
    ...overrides,
  }, audience);
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

  refreshToken: (
    overrides?: Partial<RefreshTokenRecord>,
  ): RefreshTokenRecord => ({
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
    sortOrder: 0,
    isPinned: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null,
    ...overrides,
  }),

  oauthClient: (overrides?: Partial<OAuthClientRecord>): OAuthClientRecord => ({
    id: 'oauth-client-1',
    clientId: 'test-client-id-hex',
    clientSecretHash: null,
    redirectUris: JSON.stringify(['http://localhost:3000/callback']),
    clientName: 'Test Client',
    createdAt: new Date('2025-01-01'),
    ...overrides,
  }),

  oauthCode: (overrides?: Partial<OAuthCodeRecord>): OAuthCodeRecord => ({
    id: 'oauth-code-1',
    codeHash: 'hashed-code',
    clientId: 'test-client-id-hex',
    userId: 'user-1',
    redirectUri: 'http://localhost:3000/callback',
    codeChallenge: 'test-challenge',
    codeChallengeMethod: 'S256',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    usedAt: null,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  }),
};
