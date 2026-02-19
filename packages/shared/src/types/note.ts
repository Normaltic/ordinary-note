export interface NoteSummary {
  id: string;
  title: string;
  contentPreview: string | null;
  sortOrder: number;
  isPinned: boolean;
  updatedAt: string;
}

export interface NoteDetail {
  id: string;
  folderId: string;
  title: string;
  contentPlain: string | null;
  sortOrder: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  folderId: string;
  title?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  contentPlain?: string;
  folderId?: string;
  sortOrder?: number;
  isPinned?: boolean;
}
