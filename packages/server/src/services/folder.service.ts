import type { FolderTreeNode } from '@ordinary-note/shared';
import type {
  FolderRepository,
  FolderRecord,
  FolderWithCounts,
} from '../repositories/index.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

function buildTree(folders: FolderWithCounts[]): FolderTreeNode[] {
  const map = new Map<string, FolderTreeNode>();
  const roots: FolderTreeNode[] = [];

  for (const f of folders) {
    map.set(f.id, {
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      sortOrder: f.sortOrder,
      children: [],
      noteCount: f._count.notes,
    });
  }

  for (const f of folders) {
    const node = map.get(f.id)!;
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export class FolderService {
  constructor(private readonly folderRepo: FolderRepository) {}

  async getTree(userId: string): Promise<FolderTreeNode[]> {
    let folders = await this.folderRepo.findAllByUserId(userId);

    if (folders.length === 0) {
      await this.folderRepo.create({
        userId,
        name: 'My Notes',
        sortOrder: 0,
      });
      folders = await this.folderRepo.findAllByUserId(userId);
    }

    return buildTree(folders);
  }

  async getChildren(
    userId: string,
    folderId: string,
  ): Promise<FolderWithCounts[]> {
    const folder = await this.folderRepo.findById(folderId);
    if (!folder) throw new NotFoundError('Folder');
    if (folder.userId !== userId) throw new ForbiddenError();

    return this.folderRepo.findChildrenByParentId(userId, folderId);
  }

  async create(
    userId: string,
    data: { name: string; parentId?: string },
  ): Promise<FolderRecord> {
    if (data.parentId) {
      const parent = await this.folderRepo.findById(data.parentId);
      if (!parent) throw new NotFoundError('Parent folder');
      if (parent.userId !== userId) throw new ForbiddenError();
    }

    const maxSort = await this.folderRepo.getMaxSortOrder(
      userId,
      data.parentId ?? null,
    );

    return this.folderRepo.create({
      userId,
      name: data.name,
      parentId: data.parentId,
      sortOrder: maxSort + 1,
    });
  }

  async update(
    userId: string,
    folderId: string,
    data: { name?: string; parentId?: string | null; sortOrder?: number },
  ): Promise<FolderRecord> {
    const folder = await this.folderRepo.findById(folderId);
    if (!folder) throw new NotFoundError('Folder');
    if (folder.userId !== userId) throw new ForbiddenError();

    if (data.parentId !== undefined && data.parentId !== null) {
      if (data.parentId === folderId) {
        throw new NotFoundError('Parent folder');
      }
      const parent = await this.folderRepo.findById(data.parentId);
      if (!parent) throw new NotFoundError('Parent folder');
      if (parent.userId !== userId) throw new ForbiddenError();
    }

    return this.folderRepo.update(folderId, data);
  }

  async delete(userId: string, folderId: string): Promise<void> {
    const folder = await this.folderRepo.findById(folderId);
    if (!folder) throw new NotFoundError('Folder');
    if (folder.userId !== userId) throw new ForbiddenError();

    await this.folderRepo.delete(folderId);
  }
}
