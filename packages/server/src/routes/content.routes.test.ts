import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import {
  createMockAuthService,
  createMockFolderService,
  createMockNoteService,
  createMockOAuthService,
  generateTestAccessToken,
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

describe('Content & Bulk Routes', () => {
  let noteContentService: { append: ReturnType<typeof vi.fn> };
  let bulkNoteService: { create: ReturnType<typeof vi.fn> };
  let app: ReturnType<typeof createApp>;
  let token: string;

  beforeEach(() => {
    vi.clearAllMocks();
    noteContentService = { append: vi.fn().mockResolvedValue(undefined) };
    bulkNoteService = { create: vi.fn() };
    app = createApp({
      authService: createMockAuthService() as never,
      folderService: createMockFolderService() as never,
      noteService: createMockNoteService() as never,
      oauthService: createMockOAuthService() as never,
      attachmentService: {} as never,
      noteContentService: noteContentService as never,
      bulkNoteService: bulkNoteService as never,
    });
    token = generateTestAccessToken(undefined, 'mcp');
  });

  // ── POST /api/notes/:id/content/append ───────────────────────────

  describe('POST /api/notes/:id/content/append', () => {
    it('성공: JSON body', async () => {
      const res = await request(app)
        .post('/api/notes/note-1/content/append')
        .set('Authorization', `Bearer ${token}`)
        .send({ markdown: '- 추가' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ noteId: 'note-1', appended: true });
      expect(noteContentService.append).toHaveBeenCalledWith(
        'user-1',
        'note-1',
        '- 추가',
      );
    });

    it('성공: text/markdown body', async () => {
      await request(app)
        .post('/api/notes/note-1/content/append')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'text/markdown')
        .send('## 10/24');

      expect(noteContentService.append).toHaveBeenCalledWith(
        'user-1',
        'note-1',
        '## 10/24',
      );
    });

    it('실패: markdown 누락 → 400', async () => {
      const res = await request(app)
        .post('/api/notes/note-1/content/append')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(noteContentService.append).not.toHaveBeenCalled();
    });

    it('실패: web 토큰 → 401 (content API는 mcp 전용)', async () => {
      const res = await request(app)
        .post('/api/notes/note-1/content/append')
        .set('Authorization', `Bearer ${generateTestAccessToken()}`)
        .send({ markdown: 'x' });

      expect(res.status).toBe(401);
    });
  });

  // ── POST /api/notes/bulk ─────────────────────────────────────────

  describe('POST /api/notes/bulk', () => {
    it('성공: 결과를 201로 반환', async () => {
      const result = {
        folders: [],
        notes: [{ index: 0, id: 'n1' }],
        summary: { notesCreated: 1, notesFailed: 0 },
      };
      bulkNoteService.create.mockResolvedValue(result);
      const body = {
        parentFolderId: 'folder-1',
        notes: [{ title: 'a', content: 'x', folder: ['S01'] }],
      };

      const res = await request(app)
        .post('/api/notes/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send(body);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(result);
      expect(bulkNoteService.create).toHaveBeenCalledWith('user-1', body);
    });

    it('실패: 100개 초과 → 400', async () => {
      const res = await request(app)
        .post('/api/notes/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({
          parentFolderId: 'folder-1',
          notes: Array.from({ length: 101 }, () => ({ title: 'x' })),
        });

      expect(res.status).toBe(400);
      expect(bulkNoteService.create).not.toHaveBeenCalled();
    });

    it('실패: 빈 폴더 경로 세그먼트 → 400', async () => {
      const res = await request(app)
        .post('/api/notes/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({ parentFolderId: 'folder-1', notes: [{ folder: [''] }] });

      expect(res.status).toBe(400);
    });
  });
});
