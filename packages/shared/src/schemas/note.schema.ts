import { z } from 'zod';

// ── 데이터 모델 ──

export const noteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  folderId: z.string().uuid(),
  title: z.string().max(500),
  contentPlain: z.string().nullable(),
  sortOrder: z.number().int().min(0),
  isPinned: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export type Note = z.infer<typeof noteSchema>;

// ── 요청 DTO (모델 파생) ──

export const createNoteSchema = noteSchema
  .pick({ folderId: true })
  .extend({ title: z.string().max(500).optional() });

export type CreateNoteRequest = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = noteSchema
  .pick({ title: true, folderId: true, sortOrder: true, isPinned: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateNoteRequest = z.infer<typeof updateNoteSchema>;
