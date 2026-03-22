import type { FolderTreeNode } from '@ordinary-note/shared';
import type {
  FolderRepository,
  FolderRecord,
  FolderWithCounts,
  NoteRepository,
} from '../repositories/index.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../utils/errors.js';

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
  constructor(
    private readonly folderRepo: FolderRepository,
    private readonly noteRepo: NoteRepository,
  ) {}

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
        throw new ValidationError('Cannot set folder as its own parent');
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

    const descendantIds = await this.folderRepo.findDescendantIds(folderId);
    const allFolderIds = [folderId, ...descendantIds];

    let targetFolderId = await this.folderRepo.findRootId(folderId);
    if (targetFolderId === folderId) {
      const allFolders = await this.folderRepo.findAllByUserId(userId);
      const otherRoot = allFolders.find(
        (f) => f.parentId === null && f.id !== folderId,
      );
      if (otherRoot) {
        targetFolderId = otherRoot.id;
      } else {
        const newRoot = await this.folderRepo.create({
          userId,
          name: 'My Notes',
          sortOrder: 0,
        });
        targetFolderId = newRoot.id;
      }
    }

    await this.noteRepo.softDeleteAndMoveByFolderIds(allFolderIds, targetFolderId);
    await this.folderRepo.delete(folderId);
  }
}
