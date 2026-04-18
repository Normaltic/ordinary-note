import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { ErrorCode } from '@ordinary-note/shared';
import {
  createMockAuthService,
  createMockFolderService,
  createMockNoteService,
  createMockOAuthService,
  createMockAttachmentService,
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

describe('Attachment Routes', () => {
  let mockAttachmentService: ReturnType<typeof createMockAttachmentService>;
  let app: ReturnType<typeof createApp>;
  let token: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAttachmentService = createMockAttachmentService();
    app = createApp({
      authService: createMockAuthService() as never,
      folderService: createMockFolderService() as never,
      noteService: createMockNoteService() as never,
      oauthService: createMockOAuthService() as never,
      attachmentService: mockAttachmentService as never,
      getCollaboration: (() => ({})) as never,
    });
    token = generateTestAccessToken();
  });

  // ── POST /api/attachments ───────────────────────────────────────

  describe('POST /api/attachments', () => {
    const validBody = {
      noteId: '550e8400-e29b-41d4-a716-446655440000',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024 * 100,
    };

    it('성공: presigned URL과 CDN URL 반환 (201)', async () => {
      mockAttachmentService.presign.mockResolvedValue({
        attachmentId: 'attachment-1',
        presignedUrl: 'https://s3.amazonaws.com/presigned',
        url: 'https://images.test.com/attachments/note-1/uuid.jpg',
      });

      const res = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        attachmentId: 'attachment-1',
        presignedUrl: 'https://s3.amazonaws.com/presigned',
        url: 'https://images.test.com/attachments/note-1/uuid.jpg',
      });
      expect(mockAttachmentService.presign).toHaveBeenCalledWith(
        'user-1',
        validBody,
      );
    });

    it('인증 없이 요청하면 401', async () => {
      const res = await request(app)
        .post('/api/attachments')
        .send(validBody);

      expect(res.status).toBe(401);
    });

    it('noteId가 없으면 400 (검증 실패)', async () => {
      const res = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .send({ fileName: 'photo.jpg', mimeType: 'image/jpeg', fileSize: 100 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('허용되지 않은 mimeType이면 400', async () => {
      const res = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validBody, mimeType: 'application/pdf' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('파일 크기가 10MB를 초과하면 400', async () => {
      const res = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validBody, fileSize: 11 * 1024 * 1024 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('fileSize가 0이면 400', async () => {
      const res = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validBody, fileSize: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('fileSize가 음수이면 400', async () => {
      const res = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validBody, fileSize: -100 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('fileName이 빈 문자열이면 400', async () => {
      const res = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validBody, fileName: '' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('노트가 없으면 404 (서비스에서 NotFoundError)', async () => {
      const { NotFoundError } = await import('../utils/errors.js');
      mockAttachmentService.presign.mockRejectedValue(
        new NotFoundError('Note'),
      );

      const res = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .send(validBody);

      expect(res.status).toBe(404);
    });

    it('image/webp 타입도 허용한다', async () => {
      mockAttachmentService.presign.mockResolvedValue({
        attachmentId: 'attachment-1',
        presignedUrl: 'https://s3.amazonaws.com/presigned',
        url: 'https://images.test.com/attachments/note-1/uuid.webp',
      });

      const res = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validBody, mimeType: 'image/webp', fileName: 'photo.webp' });

      expect(res.status).toBe(201);
    });

    it('image/png 타입도 허용한다', async () => {
      mockAttachmentService.presign.mockResolvedValue({
        attachmentId: 'attachment-1',
        presignedUrl: 'https://s3.amazonaws.com/presigned',
        url: 'https://images.test.com/attachments/note-1/uuid.png',
      });

      const res = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validBody, mimeType: 'image/png', fileName: 'photo.png' });

      expect(res.status).toBe(201);
    });

    it('image/gif 타입도 허용한다', async () => {
      mockAttachmentService.presign.mockResolvedValue({
        attachmentId: 'attachment-1',
        presignedUrl: 'https://s3.amazonaws.com/presigned',
        url: 'https://images.test.com/attachments/note-1/uuid.gif',
      });

      const res = await request(app)
        .post('/api/attachments')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validBody, mimeType: 'image/gif', fileName: 'anim.gif' });

      expect(res.status).toBe(201);
    });
  });

});
