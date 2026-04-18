import { prisma } from '../utils/prisma.js';

export type AttachmentRecord = {
  id: string;
  noteId: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
};

export type CreateAttachmentData = {
  noteId: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

export class AttachmentRepository {
  async create(data: CreateAttachmentData): Promise<AttachmentRecord> {
    return prisma.attachment.create({ data });
  }
}
