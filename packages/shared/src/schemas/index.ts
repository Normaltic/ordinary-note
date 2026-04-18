// 모델
export { folderSchema } from './folder.schema.js';
export type { Folder } from './folder.schema.js';
export { noteSchema } from './note.schema.js';
export type { Note } from './note.schema.js';
export { attachmentSchema } from './attachment.schema.js';
export type { Attachment } from './attachment.schema.js';

// DTO 스키마 + 타입
export { createFolderSchema, updateFolderSchema } from './folder.schema.js';
export type {
  CreateFolderRequest,
  UpdateFolderRequest,
} from './folder.schema.js';
export { createNoteSchema, updateNoteSchema } from './note.schema.js';
export type { CreateNoteRequest, UpdateNoteRequest } from './note.schema.js';
export { presignRequestSchema } from './attachment.schema.js';
export type { PresignRequest } from './attachment.schema.js';

// 상수
export {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from './attachment.schema.js';
