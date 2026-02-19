import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FolderService } from './folder.service.js';
import {
  createMockFolderRepo,
  fixtures,
} from '../testing/helpers.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

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
  },
}));

describe('FolderService', () => {
  let folderRepo: ReturnType<typeof createMockFolderRepo>;
  let service: FolderService;

  beforeEach(() => {
    vi.clearAllMocks();
    folderRepo = createMockFolderRepo();
    service = new FolderService(folderRepo as never);
  });

  // ── getTree ──────────────────────────────────────────────────────

  describe('getTree', () => {
    it('폴더 트리를 반환한다', async () => {
      const root = fixtures.folderWithCounts({ id: 'f1', parentId: null });
      const child = fixtures.folderWithCounts({ id: 'f2', parentId: 'f1' });
      folderRepo.findAllByUserId.mockResolvedValue([root, child]);

      const tree = await service.getTree('user-1');

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('f1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].id).toBe('f2');
    });

    it('폴더가 없으면 기본 폴더를 생성한다', async () => {
      folderRepo.findAllByUserId
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          fixtures.folderWithCounts({ name: 'My Notes' }),
        ]);
      folderRepo.create.mockResolvedValue(fixtures.folder({ name: 'My Notes' }));

      const tree = await service.getTree('user-1');

      expect(folderRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        name: 'My Notes',
        sortOrder: 0,
      });
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('My Notes');
    });

    it('중첩 구조를 올바르게 조립한다', async () => {
      const folders = [
        fixtures.folderWithCounts({ id: 'r', parentId: null, name: 'Root' }),
        fixtures.folderWithCounts({ id: 'c1', parentId: 'r', name: 'Child1' }),
        fixtures.folderWithCounts({ id: 'c2', parentId: 'r', name: 'Child2' }),
        fixtures.folderWithCounts({ id: 'gc', parentId: 'c1', name: 'GrandChild' }),
      ];
      folderRepo.findAllByUserId.mockResolvedValue(folders);

      const tree = await service.getTree('user-1');

      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].children).toHaveLength(1);
      expect(tree[0].children[0].children[0].name).toBe('GrandChild');
    });
  });

  // ── getChildren ──────────────────────────────────────────────────

  describe('getChildren', () => {
    it('자식 폴더 목록을 반환한다', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder());
      const children = [fixtures.folderWithCounts({ id: 'c1', parentId: 'folder-1' })];
      folderRepo.findChildrenByParentId.mockResolvedValue(children);

      const result = await service.getChildren('user-1', 'folder-1');

      expect(result).toEqual(children);
    });

    it('폴더가 없으면 NotFoundError', async () => {
      folderRepo.findById.mockResolvedValue(null);

      await expect(service.getChildren('user-1', 'no-folder'))
        .rejects.toThrow(NotFoundError);
    });

    it('소유자가 아니면 ForbiddenError', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder({ userId: 'other-user' }));

      await expect(service.getChildren('user-1', 'folder-1'))
        .rejects.toThrow(ForbiddenError);
    });
  });

  // ── create ───────────────────────────────────────────────────────

  describe('create', () => {
    it('폴더를 생성한다', async () => {
      folderRepo.getMaxSortOrder.mockResolvedValue(-1);
      const created = fixtures.folder({ name: 'New Folder', sortOrder: 0 });
      folderRepo.create.mockResolvedValue(created);

      const result = await service.create('user-1', { name: 'New Folder' });

      expect(result).toEqual(created);
      expect(folderRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        name: 'New Folder',
        sortOrder: 0,
      });
    });

    it('sortOrder를 자동으로 설정한다', async () => {
      folderRepo.getMaxSortOrder.mockResolvedValue(2);
      folderRepo.create.mockResolvedValue(fixtures.folder({ sortOrder: 3 }));

      await service.create('user-1', { name: 'Folder' });

      expect(folderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ sortOrder: 3 }),
      );
    });

    it('parentId가 있으면 부모 폴더를 검증한다', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder({ id: 'parent-1' }));
      folderRepo.getMaxSortOrder.mockResolvedValue(0);
      folderRepo.create.mockResolvedValue(fixtures.folder());

      await service.create('user-1', { name: 'Sub', parentId: 'parent-1' });

      expect(folderRepo.findById).toHaveBeenCalledWith('parent-1');
    });

    it('부모 폴더가 없으면 NotFoundError', async () => {
      folderRepo.findById.mockResolvedValue(null);

      await expect(service.create('user-1', { name: 'Sub', parentId: 'no-parent' }))
        .rejects.toThrow(NotFoundError);
    });

    it('부모 폴더의 소유자가 다르면 ForbiddenError', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder({ userId: 'other-user' }));

      await expect(service.create('user-1', { name: 'Sub', parentId: 'folder-1' }))
        .rejects.toThrow(ForbiddenError);
    });
  });

  // ── update ───────────────────────────────────────────────────────

  describe('update', () => {
    it('폴더를 업데이트한다', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder());
      const updated = fixtures.folder({ name: 'Renamed' });
      folderRepo.update.mockResolvedValue(updated);

      const result = await service.update('user-1', 'folder-1', { name: 'Renamed' });

      expect(result).toEqual(updated);
    });

    it('자기참조를 방지한다', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder({ id: 'folder-1' }));

      await expect(service.update('user-1', 'folder-1', { parentId: 'folder-1' }))
        .rejects.toThrow(NotFoundError);
    });

    it('폴더가 없으면 NotFoundError', async () => {
      folderRepo.findById.mockResolvedValue(null);

      await expect(service.update('user-1', 'no-folder', { name: 'X' }))
        .rejects.toThrow(NotFoundError);
    });

    it('소유자가 아니면 ForbiddenError', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder({ userId: 'other-user' }));

      await expect(service.update('user-1', 'folder-1', { name: 'X' }))
        .rejects.toThrow(ForbiddenError);
    });
  });

  // ── delete ───────────────────────────────────────────────────────

  describe('delete', () => {
    it('폴더를 삭제한다', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder());
      folderRepo.delete.mockResolvedValue(undefined);

      await service.delete('user-1', 'folder-1');

      expect(folderRepo.delete).toHaveBeenCalledWith('folder-1');
    });

    it('폴더가 없으면 NotFoundError', async () => {
      folderRepo.findById.mockResolvedValue(null);

      await expect(service.delete('user-1', 'no-folder'))
        .rejects.toThrow(NotFoundError);
    });

    it('소유자가 아니면 ForbiddenError', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder({ userId: 'other-user' }));

      await expect(service.delete('user-1', 'folder-1'))
        .rejects.toThrow(ForbiddenError);
    });
  });
});
