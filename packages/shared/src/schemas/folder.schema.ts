import { z } from 'zod';

// ── 데이터 모델 ──

export const folderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  name: z.string().min(1).max(255),
  sortOrder: z.number().int().min(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Folder = z.infer<typeof folderSchema>;

// ── 요청 DTO (모델 파생) ──

export const createFolderSchema = folderSchema
  .pick({ name: true })
  .extend({ parentId: z.string().optional() });

export type CreateFolderRequest = z.infer<typeof createFolderSchema>;

export const updateFolderSchema = folderSchema
  .pick({ name: true, parentId: true, sortOrder: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateFolderRequest = z.infer<typeof updateFolderSchema>;
