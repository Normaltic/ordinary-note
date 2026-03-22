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

  async findDescendantIds(folderId: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE descendants(id) AS (
        SELECT id FROM folders WHERE "parentId" = ${folderId}
        UNION ALL
        SELECT f.id FROM folders f
        JOIN descendants d ON f."parentId" = d.id
      )
      SELECT id FROM descendants
    `;
    return rows.map((r) => r.id);
  }

  async findRootId(folderId: string): Promise<string> {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE ancestors(id, "parentId") AS (
        SELECT id, "parentId" FROM folders WHERE id = ${folderId}
        UNION ALL
        SELECT f.id, f."parentId" FROM folders f
        JOIN ancestors a ON f.id = a."parentId"
      )
      SELECT id FROM ancestors WHERE "parentId" IS NULL
    `;
    return rows[0].id;
  }

  async getMaxSortOrder(
    userId: string,
    parentId: string | null,
  ): Promise<number> {
    const result = await prisma.folder.aggregate({
      where: { userId, parentId },
      _max: { sortOrder: true },
    });
    return result._max.sortOrder ?? -1;
  }
}
