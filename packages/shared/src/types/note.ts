export interface NoteSummary {
  id: string;
  title: string;
  contentPreview: string | null;
  sortOrder: number;
  isPinned: boolean;
  isMarkdown: boolean;
  updatedAt: string;
}

export interface NoteDetail {
  id: string;
  folderId: string;
  title: string;
  contentPlain: string | null;
  sortOrder: number;
  isMarkdown: boolean;
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
  isMarkdown?: boolean;
  isPinned?: boolean;
}
