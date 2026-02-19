export const APP_NAME = 'Ordinary Note';

export { ErrorCode } from './constants/errors.js';
export type { ErrorCodeType } from './constants/errors.js';

export type {
  AuthUser,
  GoogleLoginRequest,
  GoogleLoginResponse,
  RefreshResponse,
  MeResponse,
  ApiErrorResponse,
  FolderTreeNode,
  FolderSummary,
  FolderDetail,
  CreateFolderRequest,
  UpdateFolderRequest,
  NoteSummary,
  NoteDetail,
  CreateNoteRequest,
  UpdateNoteRequest,
} from './types/index.js';

export {
  createFolderSchema,
  updateFolderSchema,
  createNoteSchema,
  updateNoteSchema,
} from './schemas/index.js';
