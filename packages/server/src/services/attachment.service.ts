import crypto from 'node:crypto';
import type { PresignRequest } from '@ordinary-note/shared';
import type { AttachmentRepository } from '../repositories/attachment.repository.js';
import type { NoteRepository } from '../repositories/note.repository.js';
import { generatePresignedPutUrl, getCloudFrontUrl } from '../utils/s3.js';
import { NotFoundError } from '../utils/errors.js';

export class AttachmentService {
  constructor(
    private readonly attachmentRepo: AttachmentRepository,
    private readonly noteRepo: NoteRepository,
  ) {}

  async presign(userId: string, data: PresignRequest) {
    const note = await this.noteRepo.findActiveByIdAndUserId(
      data.noteId,
      userId,
    );
    if (!note) throw new NotFoundError('Note');

    const ext = this.extractExtension(data.fileName);
    const key = `attachments/${data.noteId}/${crypto.randomUUID()}${ext}`;

    const presignedUrl = await generatePresignedPutUrl(key, data.mimeType);

    const cdnUrl = getCloudFrontUrl(key);

    const attachment = await this.attachmentRepo.create({
      noteId: data.noteId,
      url: cdnUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
    });

    return {
      attachmentId: attachment.id,
      presignedUrl,
      url: cdnUrl,
    };
  }

  private extractExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex >= 0 ? fileName.slice(dotIndex) : '';
  }
}
