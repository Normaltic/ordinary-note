import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { BulkNoteService } from '../services/bulk-note.service.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../utils/validate.js';

const folderPathSchema = () => z.array(z.string().min(1));

const bulkCreateSchema = z.object({
  parentFolderId: z.string(),
  notes: z
    .array(
      z.object({
        title: z.string().optional(),
        content: z.string().optional(),
        folder: folderPathSchema().optional(),
      }),
    )
    .max(100),
  folders: z.array(folderPathSchema()).max(100).optional(),
});

export function createBulkRoutes(bulkNoteService: BulkNoteService) {
  const router: Router = Router();
  router.use(authenticate(['web', 'mcp']));

  // POST /api/notes/bulk — 폴더 경로 기반 노트 일괄 생성 (항목별 결과)
  router.post('/bulk', async (req: Request, res: Response) => {
    const data = validate(bulkCreateSchema, req.body);
    const result = await bulkNoteService.create(req.user!.sub, data);
    res.status(201).json(result);
  });

  return router;
}
