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
    });
    token = generateTestAccessToken();
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
        .send({ folderId: 'folder-1' });

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
        .send({ folderId: 'folder-1' });

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
      expect(res.body).toEqual({ success: true });
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
