export const APP_NAME = 'Ordinary Note';

export { ErrorCode, OAuthErrorCode } from './constants/errors.js';
export type { ErrorCodeType, OAuthErrorCodeType } from './constants/errors.js';

// 모델 스키마
export { folderSchema, noteSchema, attachmentSchema } from './schemas/index.js';
export type { Folder, Note, Attachment } from './schemas/index.js';

// DTO 스키마
export {
  createFolderSchema,
  updateFolderSchema,
  createNoteSchema,
  updateNoteSchema,
  presignRequestSchema,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
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
  PresignRequest,
} from './types/index.js';
