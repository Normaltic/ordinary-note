import { Router, type Request, type Response } from 'express';
import { presignRequestSchema } from '@ordinary-note/shared';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../utils/validate.js';
import type { AttachmentService } from '../services/attachment.service.js';

export function createAttachmentRoutes(attachmentService: AttachmentService) {
  const router: Router = Router();
  router.use(authenticate(['web']));

  // POST /api/attachments — presign (URL 발급 + DB 생성)
  router.post('/', async (req: Request, res: Response) => {
    const data = validate(presignRequestSchema, req.body);
    const result = await attachmentService.presign(req.user!.sub, data);
    res.status(201).json(result);
  });

  return router;
}
