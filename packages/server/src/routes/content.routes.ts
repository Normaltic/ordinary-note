import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { NoteService } from '../services/note.service.js';
import type { CollaborationServer } from '../collaboration/index.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../utils/validate.js';
import { yFragmentToMarkdown } from '../mcp/utils/yjs-to-markdown.js';
import { markdownToYFragment } from '../mcp/utils/markdown-to-yjs.js';
import { applyContentUpdates } from '../mcp/utils/content-updater.js';

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

type ContentDeps = {
  noteService: NoteService;
  getCollaboration: () => CollaborationServer;
};

export function createContentRoutes(deps: ContentDeps) {
  const { noteService, getCollaboration } = deps;
  const router: Router = Router();
  const auth = authenticate('mcp');

  // GET /api/notes/:id/content — 마크다운 반환
  router.get('/:id/content', auth, async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const noteId = req.params.id as string;

    await noteService.getById(userId, noteId);

    const collaboration = getCollaboration();
    const connection = await collaboration.openDirectConnection(noteId);
    let markdown = '';
    try {
      await connection.transact((doc) => {
        const fragment = doc.getXmlFragment('default');
        markdown = yFragmentToMarkdown(fragment);
      });
    } finally {
      await connection.disconnect();
    }

    res.json({ noteId, markdown });
  });

  // PUT /api/notes/:id/content — 전체 교체
  router.put('/:id/content', auth, async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const noteId = req.params.id as string;

    let markdown: string;
    if (req.is('text/markdown')) {
      markdown = req.body as string;
    } else {
      const data = validate(markdownBodySchema, req.body);
      markdown = data.markdown;
    }

    await noteService.getById(userId, noteId);

    const collaboration = getCollaboration();
    const connection = await collaboration.openDirectConnection(noteId);
    try {
      await connection.transact((doc) => {
        const fragment = doc.getXmlFragment('default');
        // Clear existing content
        fragment.delete(0, fragment.length);
        // Insert new content
        markdownToYFragment(markdown, fragment);
      });
    } finally {
      await connection.disconnect();
    }

    res.json({ noteId, replaced: true });
  });

  // PATCH /api/notes/:id/content — 부분 수정
  router.patch('/:id/content', auth, async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const noteId = req.params.id as string;

    const data = validate(contentUpdateSchema, req.body);
    await noteService.getById(userId, noteId);

    const collaboration = getCollaboration();
    const connection = await collaboration.openDirectConnection(noteId);
    try {
      await connection.transact((doc) => {
        const fragment = doc.getXmlFragment('default');
        applyContentUpdates(fragment, data.content_updates);
      });
    } finally {
      await connection.disconnect();
    }

    res.json({ noteId, edited: true });
  });

  return router;
}
