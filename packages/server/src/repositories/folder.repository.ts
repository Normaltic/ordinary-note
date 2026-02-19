import { prisma } from '../utils/prisma.js';

export type FolderRecord = {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type FolderWithCounts = FolderRecord & {
  _count: {
    children: number;
    notes: number;
  };
};

export type CreateFolderData = {
  userId: string;
  name: string;
  parentId?: string;
  sortOrder: number;
};

export type UpdateFolderData = {
  name?: string;
  parentId?: string | null;
  sortOrder?: number;
};

export class FolderRepository {
  async create(data: CreateFolderData): Promise<FolderRecord> {
    return prisma.folder.create({ data });
  }

  async findById(id: string): Promise<FolderRecord | null> {
    return prisma.folder.findUnique({ where: { id } });
  }

  async update(id: string, data: UpdateFolderData): Promise<FolderRecord> {
    return prisma.folder.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.folder.delete({ where: { id } });
  }

  async findAllByUserId(userId: string): Promise<FolderWithCounts[]> {
    return prisma.folder.findMany({
      where: { userId },
      include: { _count: { select: { children: true, notes: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findChildrenByParentId(
    userId: string,
    parentId: string,
  ): Promise<FolderWithCounts[]> {
    return prisma.folder.findMany({
      where: { userId, parentId },
      include: { _count: { select: { children: true, notes: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getMaxSortOrder(userId: string, parentId: string | null): Promise<number> {
    const result = await prisma.folder.aggregate({
      where: { userId, parentId },
      _max: { sortOrder: true },
    });
    return result._max.sortOrder ?? -1;
  }
}
