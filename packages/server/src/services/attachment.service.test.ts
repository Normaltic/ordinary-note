import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttachmentService } from './attachment.service.js';
import {
  createMockAttachmentRepo,
  createMockNoteRepo,
  fixtures,
} from '../testing/helpers.js';
import { NotFoundError } from '../utils/errors.js';

vi.mock('../utils/config.js', () => ({
  config: {
    jwt: {
      accessSecret: 'test-access-secret',
      refreshSecret: 'test-refresh-secret',
      accessExpiresIn: '1h',
      refreshExpiresIn: '14d',
      refreshMaxAge: 14 * 24 * 60 * 60 * 1000,
    },
    google: { clientId: 'test-client-id' },
    aws: {
      region: 'ap-northeast-2',
      s3ImagesBucket: 'test-bucket',
      cloudfrontImagesDomain: 'images.test.com',
    },
  },
}));

vi.mock('../utils/s3.js', () => ({
  generatePresignedPutUrl: vi.fn().mockResolvedValue('https://s3.amazonaws.com/presigned-url'),
  getCloudFrontUrl: vi.fn((key: string) => `https://images.test.com/${key}`),
}));

import { generatePresignedPutUrl } from '../utils/s3.js';

describe('AttachmentService', () => {
  let attachmentRepo: ReturnType<typeof createMockAttachmentRepo>;
  let noteRepo: ReturnType<typeof createMockNoteRepo>;
  let service: AttachmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    attachmentRepo = createMockAttachmentRepo();
    noteRepo = createMockNoteRepo();
    service = new AttachmentService(attachmentRepo as never, noteRepo as never);
  });

  // ── presign ──────────────────────────────────────────────────────

  describe('presign', () => {
    const presignData = {
      noteId: 'note-1',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg' as const,
      fileSize: 1024 * 100,
    };

    it('presigned URL과 CDN URL을 반환한다', async () => {
      noteRepo.findActiveByIdAndUserId.mockResolvedValue(fixtures.note());
      attachmentRepo.create.mockResolvedValue(fixtures.attachment());

      const result = await service.presign('user-1', presignData);

      expect(result).toEqual({
        attachmentId: 'attachment-1',
        presignedUrl: 'https://s3.amazonaws.com/presigned-url',
        url: expect.stringContaining('https://images.test.com/attachments/note-1/'),
      });
    });

    it('S3 키 형식이 attachments/{noteId}/{uuid}.{ext}이다', async () => {
      noteRepo.findActiveByIdAndUserId.mockResolvedValue(fixtures.note());
      attachmentRepo.create.mockResolvedValue(fixtures.attachment());

      await service.presign('user-1', presignData);

      expect(generatePresignedPutUrl).toHaveBeenCalledWith(
        expect.stringMatching(/^attachments\/note-1\/[a-f0-9-]+\.jpg$/),
        'image/jpeg',
        1024 * 100,
      );
    });

    it('DB에 CDN URL로 attachment를 생성한다', async () => {
      noteRepo.findActiveByIdAndUserId.mockResolvedValue(fixtures.note());
      attachmentRepo.create.mockResolvedValue(fixtures.attachment());

      await service.presign('user-1', presignData);

      expect(attachmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          noteId: 'note-1',
          url: expect.stringContaining('https://images.test.com/'),
          fileName: 'photo.jpg',
          fileSize: 1024 * 100,
          mimeType: 'image/jpeg',
        }),
      );
    });

    it('확장자가 없는 파일명도 처리한다', async () => {
      noteRepo.findActiveByIdAndUserId.mockResolvedValue(fixtures.note());
      attachmentRepo.create.mockResolvedValue(fixtures.attachment());

      await service.presign('user-1', {
        ...presignData,
        fileName: 'screenshot',
      });

      expect(generatePresignedPutUrl).toHaveBeenCalledWith(
        expect.stringMatching(/^attachments\/note-1\/[a-f0-9-]+$/),
        'image/jpeg',
        1024 * 100,
      );
    });

    it('노트가 없으면 NotFoundError', async () => {
      noteRepo.findActiveByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.presign('user-1', presignData),
      ).rejects.toThrow(NotFoundError);
    });

    it('다른 사용자의 노트이면 NotFoundError (findActiveByIdAndUserId가 null)', async () => {
      noteRepo.findActiveByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.presign('other-user', presignData),
      ).rejects.toThrow(NotFoundError);

      expect(attachmentRepo.create).not.toHaveBeenCalled();
    });
  });

});
