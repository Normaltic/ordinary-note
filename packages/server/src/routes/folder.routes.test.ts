import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { ErrorCode } from '@ordinary-note/shared';
import {
  createMockAuthService,
  createMockFolderService,
  createMockNoteService,
  generateTestAccessToken,
  fixtures,
} from '../testing/helpers.js';

vi.mock('../utils/config.js', () => ({
  config: {
    port: 3001,
    nodeEnv: 'test',
    clientUrl: 'http://localhost:5173',
    google: { clientId: 'test-client-id' },
    jwt: {
      accessSecret: 'test-access-secret',
      refreshSecret: 'test-refresh-secret',
      accessExpiresIn: '1h',
      refreshExpiresIn: '14d',
      refreshMaxAge: 14 * 24 * 60 * 60 * 1000,
    },
  },
}));

import { createApp } from '../app.js';

describe('Folder Routes', () => {
  let mockFolderService: ReturnType<typeof createMockFolderService>;
  let mockNoteService: ReturnType<typeof createMockNoteService>;
  let app: ReturnType<typeof createApp>;
  let token: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFolderService = createMockFolderService();
    mockNoteService = createMockNoteService();
    app = createApp({
      authService: createMockAuthService() as never,
      folderService: mockFolderService as never,
      noteService: mockNoteService as never,
    });
    token = generateTestAccessToken();
  });

  // ── GET /api/folders ─────────────────────────────────────────────

  describe('GET /api/folders', () => {
    it('성공: 폴더 트리 반환', async () => {
      const tree = [{ id: 'f1', name: 'Root', parentId: null, sortOrder: 0, children: [], noteCount: 0 }];
      mockFolderService.getTree.mockResolvedValue(tree);

      const res = await request(app)
        .get('/api/folders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.folders).toEqual(tree);
    });

    it('실패: 인증 없음 → 401', async () => {
      const res = await request(app).get('/api/folders');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCode.AUTH_INVALID_TOKEN);
    });
  });

  // ── POST /api/folders ────────────────────────────────────────────

  describe('POST /api/folders', () => {
    it('성공: 폴더 생성 → 201', async () => {
      const folder = fixtures.folder({ name: 'New' });
      mockFolderService.create.mockResolvedValue(folder);

      const res = await request(app)
        .post('/api/folders')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New' });

      expect(res.status).toBe(201);
      expect(res.body.folder).toBeDefined();
    });

    it('실패: name 누락 → 400 VALIDATION_FAILED', async () => {
      const res = await request(app)
        .post('/api/folders')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });
  });

  // ── GET /api/folders/:id/children ────────────────────────────────

  describe('GET /api/folders/:id/children', () => {
    it('성공: 자식 폴더 + 노트 반환', async () => {
      const childFolder = fixtures.folderWithCounts({ id: 'c1', parentId: 'f1' });
      const note = fixtures.note({ folderId: 'f1' });
      mockFolderService.getChildren.mockResolvedValue([childFolder]);
      mockNoteService.getByFolderId.mockResolvedValue([note]);

      const res = await request(app)
        .get('/api/folders/f1/children')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.folders).toHaveLength(1);
      expect(res.body.notes).toHaveLength(1);
      expect(res.body.folders[0]).toEqual({
        id: 'c1',
        name: childFolder.name,
        sortOrder: childFolder.sortOrder,
        childCount: 0,
        noteCount: 0,
      });
    });

    it('실패: 폴더 NotFound → 404', async () => {
      const { NotFoundError } = await import('../utils/errors.js');
      mockFolderService.getChildren.mockRejectedValue(new NotFoundError('Folder'));
      mockNoteService.getByFolderId.mockRejectedValue(new NotFoundError('Folder'));

      const res = await request(app)
        .get('/api/folders/no-folder/children')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    });
  });

  // ── PATCH /api/folders/:id ───────────────────────────────────────

  describe('PATCH /api/folders/:id', () => {
    it('성공: 폴더 이름 변경', async () => {
      const updated = fixtures.folder({ name: 'Renamed' });
      mockFolderService.update.mockResolvedValue(updated);

      const res = await request(app)
        .patch('/api/folders/folder-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Renamed' });

      expect(res.status).toBe(200);
      expect(res.body.folder.name).toBe('Renamed');
    });

    it('실패: 빈 body → 400 VALIDATION_FAILED', async () => {
      const res = await request(app)
        .patch('/api/folders/folder-1')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('실패: 소유자 아님 → 403', async () => {
      const { ForbiddenError } = await import('../utils/errors.js');
      mockFolderService.update.mockRejectedValue(new ForbiddenError());

      const res = await request(app)
        .patch('/api/folders/folder-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Hack' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ErrorCode.RESOURCE_FORBIDDEN);
    });
  });

  // ── DELETE /api/folders/:id ──────────────────────────────────────

  describe('DELETE /api/folders/:id', () => {
    it('성공: 폴더 삭제', async () => {
      mockFolderService.delete.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/folders/folder-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });

    it('실패: 폴더 NotFound → 404', async () => {
      const { NotFoundError } = await import('../utils/errors.js');
      mockFolderService.delete.mockRejectedValue(new NotFoundError('Folder'));

      const res = await request(app)
        .delete('/api/folders/no-folder')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    });
  });
});
