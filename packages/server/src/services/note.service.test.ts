import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoteService } from './note.service.js';
import {
  createMockNoteRepo,
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

describe('NoteService', () => {
  let noteRepo: ReturnType<typeof createMockNoteRepo>;
  let folderRepo: ReturnType<typeof createMockFolderRepo>;
  let service: NoteService;

  beforeEach(() => {
    vi.clearAllMocks();
    noteRepo = createMockNoteRepo();
    folderRepo = createMockFolderRepo();
    service = new NoteService(noteRepo as never, folderRepo as never);
  });

  // ── getById ──────────────────────────────────────────────────────

  describe('getById', () => {
    it('노트를 반환한다', async () => {
      const note = fixtures.note();
      noteRepo.findActiveById.mockResolvedValue(note);

      const result = await service.getById('user-1', 'note-1');

      expect(result).toEqual(note);
    });

    it('삭제된 노트는 NotFoundError', async () => {
      noteRepo.findActiveById.mockResolvedValue(null);

      await expect(service.getById('user-1', 'note-1'))
        .rejects.toThrow(NotFoundError);
    });

    it('소유자가 아니면 ForbiddenError', async () => {
      noteRepo.findActiveById.mockResolvedValue(fixtures.note({ userId: 'other-user' }));

      await expect(service.getById('user-1', 'note-1'))
        .rejects.toThrow(ForbiddenError);
    });
  });

  // ── getByFolderId ────────────────────────────────────────────────

  describe('getByFolderId', () => {
    it('폴더 내 노트 목록을 반환한다', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder());
      const notes = [fixtures.note()];
      noteRepo.findByFolderId.mockResolvedValue(notes);

      const result = await service.getByFolderId('user-1', 'folder-1');

      expect(result).toEqual(notes);
    });

    it('폴더가 없으면 NotFoundError', async () => {
      folderRepo.findById.mockResolvedValue(null);

      await expect(service.getByFolderId('user-1', 'no-folder'))
        .rejects.toThrow(NotFoundError);
    });

    it('폴더 소유자가 아니면 ForbiddenError', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder({ userId: 'other-user' }));

      await expect(service.getByFolderId('user-1', 'folder-1'))
        .rejects.toThrow(ForbiddenError);
    });
  });

  // ── create ───────────────────────────────────────────────────────

  describe('create', () => {
    it('노트를 생성한다', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder());
      noteRepo.getMaxSortOrder.mockResolvedValue(-1);
      const created = fixtures.note();
      noteRepo.create.mockResolvedValue(created);

      const result = await service.create('user-1', { folderId: 'folder-1' });

      expect(result).toEqual(created);
    });

    it('sortOrder를 자동으로 설정한다', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder());
      noteRepo.getMaxSortOrder.mockResolvedValue(5);
      noteRepo.create.mockResolvedValue(fixtures.note({ sortOrder: 6 }));

      await service.create('user-1', { folderId: 'folder-1' });

      expect(noteRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ sortOrder: 6 }),
      );
    });

    it('폴더가 없으면 NotFoundError', async () => {
      folderRepo.findById.mockResolvedValue(null);

      await expect(service.create('user-1', { folderId: 'no-folder' }))
        .rejects.toThrow(NotFoundError);
    });

    it('폴더 소유자가 다르면 ForbiddenError', async () => {
      folderRepo.findById.mockResolvedValue(fixtures.folder({ userId: 'other-user' }));

      await expect(service.create('user-1', { folderId: 'folder-1' }))
        .rejects.toThrow(ForbiddenError);
    });
  });

  // ── update ───────────────────────────────────────────────────────

  describe('update', () => {
    it('노트를 업데이트한다', async () => {
      noteRepo.findActiveById.mockResolvedValue(fixtures.note());
      const updated = fixtures.note({ title: 'Updated' });
      noteRepo.update.mockResolvedValue(updated);

      const result = await service.update('user-1', 'note-1', { title: 'Updated' });

      expect(result).toEqual(updated);
    });

    it('폴더 이동 시 대상 폴더를 검증한다', async () => {
      noteRepo.findActiveById.mockResolvedValue(fixtures.note());
      folderRepo.findById.mockResolvedValue(fixtures.folder({ id: 'folder-2' }));
      noteRepo.update.mockResolvedValue(fixtures.note({ folderId: 'folder-2' }));

      await service.update('user-1', 'note-1', { folderId: 'folder-2' });

      expect(folderRepo.findById).toHaveBeenCalledWith('folder-2');
    });

    it('노트가 없으면 NotFoundError', async () => {
      noteRepo.findActiveById.mockResolvedValue(null);

      await expect(service.update('user-1', 'note-1', { title: 'X' }))
        .rejects.toThrow(NotFoundError);
    });

    it('소유자가 아니면 ForbiddenError', async () => {
      noteRepo.findActiveById.mockResolvedValue(fixtures.note({ userId: 'other-user' }));

      await expect(service.update('user-1', 'note-1', { title: 'X' }))
        .rejects.toThrow(ForbiddenError);
    });
  });

  // ── delete ───────────────────────────────────────────────────────

  describe('delete', () => {
    it('노트를 소프트 삭제한다', async () => {
      noteRepo.findActiveById.mockResolvedValue(fixtures.note());
      noteRepo.softDelete.mockResolvedValue(undefined);

      await service.delete('user-1', 'note-1');

      expect(noteRepo.softDelete).toHaveBeenCalledWith('note-1');
    });

    it('노트가 없으면 NotFoundError', async () => {
      noteRepo.findActiveById.mockResolvedValue(null);

      await expect(service.delete('user-1', 'no-note'))
        .rejects.toThrow(NotFoundError);
    });

    it('소유자가 아니면 ForbiddenError', async () => {
      noteRepo.findActiveById.mockResolvedValue(fixtures.note({ userId: 'other-user' }));

      await expect(service.delete('user-1', 'note-1'))
        .rejects.toThrow(ForbiddenError);
    });
  });
});
