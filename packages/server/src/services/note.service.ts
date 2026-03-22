import type {
  NoteRepository,
  NoteRecord,
  FolderRepository,
} from '../repositories/index.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export class NoteService {
  constructor(
    private readonly noteRepo: NoteRepository,
    private readonly folderRepo: FolderRepository,
  ) {}

  async getById(userId: string, noteId: string): Promise<NoteRecord> {
    const note = await this.noteRepo.findActiveById(noteId);
    if (!note) throw new NotFoundError('Note');
    if (note.userId !== userId) throw new ForbiddenError();
    return note;
  }

  async getByFolderId(userId: string, folderId: string): Promise<NoteRecord[]> {
    const folder = await this.folderRepo.findById(folderId);
    if (!folder) throw new NotFoundError('Folder');
    if (folder.userId !== userId) throw new ForbiddenError();

    return this.noteRepo.findByFolderId(folderId);
  }

  async create(
    userId: string,
    data: { folderId: string; title?: string },
  ): Promise<NoteRecord> {
    const folder = await this.folderRepo.findById(data.folderId);
    if (!folder) throw new NotFoundError('Folder');
    if (folder.userId !== userId) throw new ForbiddenError();

    const maxSort = await this.noteRepo.getMaxSortOrder(data.folderId);

    return this.noteRepo.create({
      userId,
      folderId: data.folderId,
      title: data.title,
      sortOrder: maxSort + 1,
    });
  }

  async update(
    userId: string,
    noteId: string,
    data: {
      title?: string;
      folderId?: string;
      sortOrder?: number;
      isPinned?: boolean;
    },
  ): Promise<NoteRecord> {
    const note = await this.noteRepo.findActiveById(noteId);
    if (!note) throw new NotFoundError('Note');
    if (note.userId !== userId) throw new ForbiddenError();

    if (data.folderId && data.folderId !== note.folderId) {
      const folder = await this.folderRepo.findById(data.folderId);
      if (!folder) throw new NotFoundError('Folder');
      if (folder.userId !== userId) throw new ForbiddenError();
    }

    return this.noteRepo.update(noteId, data);
  }

  async delete(userId: string, noteId: string): Promise<void> {
    const note = await this.noteRepo.findActiveById(noteId);
    if (!note) throw new NotFoundError('Note');
    if (note.userId !== userId) throw new ForbiddenError();

    await this.noteRepo.softDelete(noteId);
  }

  async search(
    userId: string,
    query: string,
    limit?: number,
  ) {
    return this.noteRepo.searchByContent(userId, query, limit);
  }

  async getRecent(userId: string, limit?: number) {
    return this.noteRepo.findRecent(userId, limit);
  }

  async getPinned(userId: string, limit?: number) {
    return this.noteRepo.findPinned(userId, limit);
  }

  async getDeleted(userId: string, limit?: number) {
    return this.noteRepo.findDeleted(userId, limit);
  }

  async restore(userId: string, noteId: string): Promise<NoteRecord> {
    const note = await this.noteRepo.findDeletedById(noteId);
    if (!note) throw new NotFoundError('Note');
    if (note.userId !== userId) throw new ForbiddenError();

    // 원본 폴더가 존재하는지 확인, 없으면 루트 폴더로
    const folder = await this.folderRepo.findById(note.folderId);
    if (!folder) {
      const allFolders = await this.folderRepo.findAllByUserId(userId);
      const rootFolder = allFolders.find((f) => f.parentId === null);
      if (!rootFolder) throw new NotFoundError('Folder');
      return this.noteRepo.restore(noteId, rootFolder.id);
    }

    return this.noteRepo.restore(noteId);
  }

  async permanentDelete(userId: string, noteId: string): Promise<void> {
    const note = await this.noteRepo.findDeletedById(noteId);
    if (!note) throw new NotFoundError('Note');
    if (note.userId !== userId) throw new ForbiddenError();

    await this.noteRepo.permanentDelete(noteId);
  }

  async emptyTrash(userId: string): Promise<void> {
    await this.noteRepo.permanentDeleteAllByUserId(userId);
  }
}
