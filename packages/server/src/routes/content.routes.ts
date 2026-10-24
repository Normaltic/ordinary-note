import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { NoteContentService } from '../services/note-content.service.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../utils/validate.js';

const contentUpdateSchema = z.object({
  content_updates: z.array(
    z.object({
      old_content: z.string(),
      new_content: z.string(),
    }),
  ),
});

const markdownBodySchema = z.object({
  markdown: z.string(),
});

/** text/markdown 본문 또는 JSON { markdown } */
function readMarkdownBody(req: Request): string {
  if (req.is('text/markdown')) return req.body as string;
  return validate(markdownBodySchema, req.body).markdown;
}

export function createContentRoutes(noteContentService: NoteContentService) {
  const router: Router = Router();
  const auth = authenticate('mcp');

  // GET /api/notes/:id/content — 마크다운 반환
  router.get('/:id/content', auth, async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const noteId = req.params.id as string;

    const markdown = await noteContentService.getMarkdown(userId, noteId);
    res.json({ noteId, markdown });
  });

  // PUT /api/notes/:id/content — 전체 교체
  router.put('/:id/content', auth, async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const noteId = req.params.id as string;

    const markdown = readMarkdownBody(req);
    await noteContentService.replace(userId, noteId, markdown);
    res.json({ noteId, replaced: true });
  });

  // POST /api/notes/:id/content/append — 본문 끝에 추가
  router.post(
    '/:id/content/append',
    auth,
    async (req: Request, res: Response) => {
      const userId = req.user!.sub;
      const noteId = req.params.id as string;

      const markdown = readMarkdownBody(req);
      await noteContentService.append(userId, noteId, markdown);
      res.json({ noteId, appended: true });
    },
  );

  // PATCH /api/notes/:id/content — 부분 수정
  router.patch('/:id/content', auth, async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const noteId = req.params.id as string;

    const data = validate(contentUpdateSchema, req.body);
    await noteContentService.applyUpdates(userId, noteId, data.content_updates);
    res.json({ noteId, edited: true });
  });

  return router;
}
