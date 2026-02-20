import { prisma } from '../utils/prisma.js';

export type NoteRecord = {
  id: string;
  userId: string;
  folderId: string;
  title: string;
  contentPlain: string | null;
  contentHtml: string | null;
  sortOrder: number;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type CreateNoteData = {
  userId: string;
  folderId: string;
  title?: string;
  sortOrder: number;
};

export type UpdateNoteData = {
  title?: string;
  contentPlain?: string | null;
  contentHtml?: string | null;
  folderId?: string;
  sortOrder?: number;
  isPinned?: boolean;
};

export class NoteRepository {
  async create(data: CreateNoteData): Promise<NoteRecord> {
    return prisma.note.create({ data });
  }

  async findById(id: string): Promise<NoteRecord | null> {
    return prisma.note.findUnique({ where: { id } });
  }

  async findActiveById(id: string): Promise<NoteRecord | null> {
    return prisma.note.findFirst({ where: { id, deletedAt: null } });
  }

  async update(id: string, data: UpdateNoteData): Promise<NoteRecord> {
    return prisma.note.update({ where: { id }, data });
  }

  async findByFolderId(folderId: string): Promise<NoteRecord[]> {
    return prisma.note.findMany({
      where: { folderId, deletedAt: null },
      orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.note.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getMaxSortOrder(folderId: string): Promise<number> {
    const result = await prisma.note.aggregate({
      where: { folderId, deletedAt: null },
      _max: { sortOrder: true },
    });
    return result._max.sortOrder ?? -1;
  }
}
