import type { Note } from '../schemas/note.schema.js';

export interface NoteSummary {
  id: Note['id'];
  title: Note['title'];
  contentPreview: string | null;
  sortOrder: Note['sortOrder'];
  isPinned: Note['isPinned'];
  updatedAt: string;
}

export interface NoteDetail {
  id: Note['id'];
  folderId: Note['folderId'];
  title: Note['title'];
  contentPlain: Note['contentPlain'];
  sortOrder: Note['sortOrder'];
  isPinned: Note['isPinned'];
  createdAt: string;
  updatedAt: string;
}
