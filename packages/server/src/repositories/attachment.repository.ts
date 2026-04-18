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

  async findById(id: string): Promise<AttachmentRecord | null> {
    return prisma.attachment.findUnique({ where: { id } });
  }

  async findByNoteId(noteId: string): Promise<AttachmentRecord[]> {
    return prisma.attachment.findMany({
      where: { noteId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUrl(id: string, url: string): Promise<AttachmentRecord> {
    return prisma.attachment.update({ where: { id }, data: { url } });
  }

  async delete(id: string): Promise<void> {
    await prisma.attachment.delete({ where: { id } });
  }
}
