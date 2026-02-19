import { Router, type Request, type Response } from 'express';
import {
  createFolderSchema,
  updateFolderSchema,
  type FolderSummary,
  type NoteSummary,
} from '@ordinary-note/shared';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../utils/validate.js';
import type { FolderService } from '../services/folder.service.js';
import type { NoteService } from '../services/note.service.js';

export function createFolderRoutes(
  folderService: FolderService,
  noteService: NoteService,
) {
  const router: Router = Router();
  router.use(authenticate);

  // GET /api/folders — full folder tree
  router.get('/', async (req: Request, res: Response) => {
    const folders = await folderService.getTree(req.user!.sub);
    res.json({ folders });
  });

  // POST /api/folders — create folder
  router.post('/', async (req: Request, res: Response) => {
    const data = validate(createFolderSchema, req.body);
    const folder = await folderService.create(req.user!.sub, data);
    res.status(201).json({ folder });
  });

  // GET /api/folders/:id/children — children folders + notes
  router.get('/:id/children', async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const folderId = req.params.id as string;

    const [childFolders, notes] = await Promise.all([
      folderService.getChildren(userId, folderId),
      noteService.getByFolderId(userId, folderId),
    ]);

    const folders: FolderSummary[] = childFolders.map((f) => ({
      id: f.id,
      name: f.name,
      sortOrder: f.sortOrder,
      childCount: f._count.children,
      noteCount: f._count.notes,
    }));

    const noteSummaries: NoteSummary[] = notes.map((n) => ({
      id: n.id,
      title: n.title,
      contentPreview: n.contentPlain?.slice(0, 200) ?? null,
      sortOrder: n.sortOrder,
      isPinned: n.isPinned,
      isMarkdown: n.isMarkdown,
      updatedAt: n.updatedAt.toISOString(),
    }));

    res.json({ folders, notes: noteSummaries });
  });

  // PATCH /api/folders/:id — update folder
  router.patch('/:id', async (req: Request, res: Response) => {
    const data = validate(updateFolderSchema, req.body);
    const folder = await folderService.update(
      req.user!.sub,
      req.params.id as string,
      data,
    );
    res.json({ folder });
  });

  // DELETE /api/folders/:id — delete folder
  router.delete('/:id', async (req: Request, res: Response) => {
    await folderService.delete(req.user!.sub, req.params.id as string);
    res.json({ success: true });
  });

  return router;
}
