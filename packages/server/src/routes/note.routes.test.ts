import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { ErrorCode } from '@ordinary-note/shared';
import {
  createMockAuthService,
  createMockFolderService,
  createMockNoteService,
  createMockOAuthService,
  generateTestAccessToken,
  fixtures,
} from '../testing/helpers.js';

vi.mock('../utils/config.js', () => ({
  config: {
    port: 3001,
    nodeEnv: 'test',
    clientUrl: 'http://localhost:5173',
    serverUrl: 'http://localhost:3001',
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

describe('Note Routes', () => {
  let mockNoteService: ReturnType<typeof createMockNoteService>;
  let app: ReturnType<typeof createApp>;
  let token: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNoteService = createMockNoteService();
    app = createApp({
      authService: createMockAuthService() as never,
      folderService: createMockFolderService() as never,
      noteService: mockNoteService as never,
      oauthService: createMockOAuthService() as never,
      attachmentService: {} as never,
      getCollaboration: (() => ({})) as never,
    });
    token = generateTestAccessToken();
  });

  // ── GET /api/notes/recent ────────────────────────────────────────

  describe('GET /api/notes/recent', () => {
    it('성공: 최근 노트 목록 반환', async () => {
      const notes = [
        { ...fixtures.note(), folder: { name: 'My Notes' } },
        { ...fixtures.note({ id: 'note-2' }), folder: { name: 'Work' } },
      ];
      mockNoteService.getRecent.mockResolvedValue(notes);

      const res = await request(app)
        .get('/api/notes/recent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.notes).toHaveLength(2);
      expect(res.body.notes[0].folderName).toBe('My Notes');
      expect(res.body.notes[0].folder).toBeUndefined();
    });

    it('성공: limit 파라미터 전달', async () => {
      mockNoteService.getRecent.mockResolvedValue([]);

      await request(app)
        .get('/api/notes/recent?limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(mockNoteService.getRecent).toHaveBeenCalledWith('user-1', 5);
    });

    it('실패: 인증 없음 → 401', async () => {
      const res = await request(app).get('/api/notes/recent');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCode.AUTH_INVALID_TOKEN);
    });
  });

  // ── GET /api/notes/pinned ───────────────────────────────────────

  describe('GET /api/notes/pinned', () => {
    it('성공: 핀 노트 목록 반환', async () => {
      const notes = [
        { ...fixtures.note(), folder: { name: 'My Notes' } },
        { ...fixtures.note({ id: 'note-2' }), folder: { name: 'Work' } },
      ];
      mockNoteService.getPinned.mockResolvedValue(notes);

      const res = await request(app)
        .get('/api/notes/pinned')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.notes).toHaveLength(2);
      expect(res.body.notes[0].folderName).toBe('My Notes');
      expect(res.body.notes[0].folder).toBeUndefined();
    });

    it('성공: limit 파라미터 전달', async () => {
      mockNoteService.getPinned.mockResolvedValue([]);

      await request(app)
        .get('/api/notes/pinned?limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(mockNoteService.getPinned).toHaveBeenCalledWith('user-1', 5);
    });

    it('실패: 인증 없음 → 401', async () => {
      const res = await request(app).get('/api/notes/pinned');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCode.AUTH_INVALID_TOKEN);
    });
  });

  // ── GET /api/notes/deleted ──────────────────────────────────────

  describe('GET /api/notes/deleted', () => {
    it('성공: 삭제된 노트 목록 반환', async () => {
      const notes = [
        { ...fixtures.note({ deletedAt: new Date() }), folder: { name: 'My Notes' } },
      ];
      mockNoteService.getDeleted.mockResolvedValue(notes);

      const res = await request(app)
        .get('/api/notes/deleted')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.notes).toHaveLength(1);
      expect(res.body.notes[0].folderName).toBe('My Notes');
      expect(res.body.notes[0].deletedAt).toBeDefined();
    });

    it('성공: limit 파라미터 전달', async () => {
      mockNoteService.getDeleted.mockResolvedValue([]);

      await request(app)
        .get('/api/notes/deleted?limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(mockNoteService.getDeleted).toHaveBeenCalledWith('user-1', 10);
    });
  });

  // ── PATCH /api/notes/:id/restore ──────────────────────────────

  describe('PATCH /api/notes/:id/restore', () => {
    it('성공: 노트 복원', async () => {
      const note = fixtures.note();
      mockNoteService.restore.mockResolvedValue(note);

      const res = await request(app)
        .patch('/api/notes/note-1/restore')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.note.id).toBe('note-1');
    });

    it('실패: 노트 NotFound → 404', async () => {
      const { NotFoundError } = await import('../utils/errors.js');
      mockNoteService.restore.mockRejectedValue(new NotFoundError('Note'));

      const res = await request(app)
        .patch('/api/notes/no-note/restore')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    });
  });

  // ── DELETE /api/notes/:id/permanent ───────────────────────────

  describe('DELETE /api/notes/:id/permanent', () => {
    it('성공: 노트 영구 삭제', async () => {
      mockNoteService.permanentDelete.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/notes/note-1/permanent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 'note-1' });
    });

    it('실패: 노트 NotFound → 404', async () => {
      const { NotFoundError } = await import('../utils/errors.js');
      mockNoteService.permanentDelete.mockRejectedValue(new NotFoundError('Note'));

      const res = await request(app)
        .delete('/api/notes/no-note/permanent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    });
  });

  // ── DELETE /api/notes/trash ───────────────────────────────────

  describe('DELETE /api/notes/trash', () => {
    it('성공: 휴지통 비우기', async () => {
      mockNoteService.emptyTrash.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/notes/trash')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });
  });

  // ── GET /api/notes/:id ───────────────────────────────────────────

  describe('GET /api/notes/:id', () => {
    it('성공: 노트 상세 반환', async () => {
      const note = fixtures.note();
      mockNoteService.getById.mockResolvedValue(note);

      const res = await request(app)
        .get('/api/notes/note-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.note).toBeDefined();
      expect(res.body.note.id).toBe('note-1');
    });

    it('실패: 노트 NotFound → 404', async () => {
      const { NotFoundError } = await import('../utils/errors.js');
      mockNoteService.getById.mockRejectedValue(new NotFoundError('Note'));

      const res = await request(app)
        .get('/api/notes/no-note')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    });

    it('실패: 인증 없음 → 401', async () => {
      const res = await request(app).get('/api/notes/note-1');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCode.AUTH_INVALID_TOKEN);
    });
  });

  // ── POST /api/notes ──────────────────────────────────────────────

  describe('POST /api/notes', () => {
    it('성공: 노트 생성 → 201', async () => {
      const note = fixtures.note();
      mockNoteService.create.mockResolvedValue(note);

      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ folderId: '00000000-0000-4000-8000-000000000001' });

      expect(res.status).toBe(201);
      expect(res.body.note).toBeDefined();
    });

    it('실패: folderId 누락 → 400 VALIDATION_FAILED', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('실패: 폴더 소유자 아님 → 403', async () => {
      const { ForbiddenError } = await import('../utils/errors.js');
      mockNoteService.create.mockRejectedValue(new ForbiddenError());

      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ folderId: '00000000-0000-4000-8000-000000000001' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ErrorCode.RESOURCE_FORBIDDEN);
    });
  });

  // ── PATCH /api/notes/:id ─────────────────────────────────────────

  describe('PATCH /api/notes/:id', () => {
    it('성공: 노트 업데이트', async () => {
      const updated = fixtures.note({ title: 'Updated Title' });
      mockNoteService.update.mockResolvedValue(updated);

      const res = await request(app)
        .patch('/api/notes/note-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.note.title).toBe('Updated Title');
    });

    it('실패: 빈 body → 400 VALIDATION_FAILED', async () => {
      const res = await request(app)
        .patch('/api/notes/note-1')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('실패: 소유자 아님 → 403', async () => {
      const { ForbiddenError } = await import('../utils/errors.js');
      mockNoteService.update.mockRejectedValue(new ForbiddenError());

      const res = await request(app)
        .patch('/api/notes/note-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Hack' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ErrorCode.RESOURCE_FORBIDDEN);
    });
  });

  // ── DELETE /api/notes/:id ────────────────────────────────────────

  describe('DELETE /api/notes/:id', () => {
    it('성공: 노트 삭제', async () => {
      mockNoteService.delete.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/notes/note-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 'note-1' });
    });

    it('실패: 노트 NotFound → 404', async () => {
      const { NotFoundError } = await import('../utils/errors.js');
      mockNoteService.delete.mockRejectedValue(new NotFoundError('Note'));

      const res = await request(app)
        .delete('/api/notes/no-note')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    });
  });
});
