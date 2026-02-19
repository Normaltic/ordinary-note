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
      contentPlain?: string | null;
      folderId?: string;
      sortOrder?: number;
      isMarkdown?: boolean;
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
}
