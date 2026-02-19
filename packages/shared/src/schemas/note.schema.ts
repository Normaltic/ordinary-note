import { z } from 'zod';

export const createNoteSchema = z.object({
  folderId: z.string().min(1, 'Folder ID is required'),
  title: z.string().max(500, 'Title is too long').optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().max(500, 'Title is too long').optional(),
  contentPlain: z.string().nullable().optional(),
  folderId: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isPinned: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});
