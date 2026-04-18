import crypto from 'node:crypto';
import type { PresignRequest } from '@ordinary-note/shared';
import type { AttachmentRepository } from '../repositories/attachment.repository.js';
import type { NoteRepository } from '../repositories/note.repository.js';
import {
  generatePresignedPutUrl,
  getCloudFrontUrl,
  deleteS3Object,
  extractS3KeyFromUrl,
} from '../utils/s3.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

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

    const presignedUrl = await generatePresignedPutUrl(
      key,
      data.mimeType,
      data.fileSize,
    );

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

  async delete(userId: string, attachmentId: string) {
    const attachment = await this.attachmentRepo.findById(attachmentId);
    if (!attachment) throw new NotFoundError('Attachment');

    const note = await this.noteRepo.findActiveByIdAndUserId(
      attachment.noteId,
      userId,
    );
    if (!note) throw new ForbiddenError();

    const s3Key = extractS3KeyFromUrl(attachment.url) ?? attachment.url;
    await deleteS3Object(s3Key);

    await this.attachmentRepo.delete(attachmentId);
    return { id: attachmentId };
  }

  private extractExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex >= 0 ? fileName.slice(dotIndex) : '';
  }
}
