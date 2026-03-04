export const APP_NAME = 'Ordinary Note';

export { ErrorCode } from './constants/errors.js';
export type { ErrorCodeType } from './constants/errors.js';

// 모델 스키마
export { folderSchema, noteSchema } from './schemas/index.js';
export type { Folder, Note } from './schemas/index.js';

// DTO 스키마
export {
  createFolderSchema,
  updateFolderSchema,
  createNoteSchema,
  updateNoteSchema,
} from './schemas/index.js';

// 타입
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
