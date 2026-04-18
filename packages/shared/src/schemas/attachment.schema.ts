import { z } from 'zod';

// ── 상수 ──

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ── 데이터 모델 ──

export const attachmentSchema = z.object({
  id: z.string().uuid(),
  noteId: z.string().uuid(),
  url: z.string(),
  fileName: z.string(),
  fileSize: z.number().int(),
  mimeType: z.string(),
  createdAt: z.coerce.date(),
});

export type Attachment = z.infer<typeof attachmentSchema>;

// ── 요청 DTO ──

export const presignRequestSchema = z.object({
  noteId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_IMAGE_TYPES),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
});

export type PresignRequest = z.infer<typeof presignRequestSchema>;
