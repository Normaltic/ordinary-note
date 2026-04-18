export type {
  AuthUser,
  GoogleLoginRequest,
  GoogleLoginResponse,
  RefreshResponse,
  MeResponse,
  ApiErrorResponse,
} from './auth.js';

export type { FolderTreeNode, FolderSummary, FolderDetail } from './folder.js';
export type { NoteSummary, NoteDetail } from './note.js';

// DTO 타입 re-export (schemas에서)
export type {
  CreateFolderRequest,
  UpdateFolderRequest,
} from '../schemas/folder.schema.js';
export type {
  CreateNoteRequest,
  UpdateNoteRequest,
} from '../schemas/note.schema.js';
export type { PresignRequest } from '../schemas/attachment.schema.js';
