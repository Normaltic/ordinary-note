import { Router, type Request, type Response } from 'express';
import { createNoteSchema, updateNoteSchema } from '@ordinary-note/shared';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../utils/validate.js';
import type { NoteService } from '../services/note.service.js';

export function createNoteRoutes(noteService: NoteService) {
  const router: Router = Router();
  router.use(authenticate(['web', 'mcp']));

  // GET /api/notes/search?query=...&limit=... — search notes
  router.get('/search', async (req: Request, res: Response) => {
    const query = req.query.query as string;
    if (!query) {
      res.json({ notes: [] });
      return;
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const notes = await noteService.search(req.user!.sub, query, limit);
    res.json({
      notes: notes.map((n) => ({
        ...n,
        folderName: n.folder?.name ?? null,
        folder: undefined,
      })),
    });
  });

  // GET /api/notes/:id — get note detail
  router.get('/:id', async (req: Request, res: Response) => {
    const note = await noteService.getById(
      req.user!.sub,
      req.params.id as string,
    );
    res.json({ note });
  });

  // POST /api/notes — create note
  router.post('/', async (req: Request, res: Response) => {
    const data = validate(createNoteSchema, req.body);
    const note = await noteService.create(req.user!.sub, data);
    res.status(201).json({ note });
  });

  // PATCH /api/notes/:id — update note
  router.patch('/:id', async (req: Request, res: Response) => {
    const data = validate(updateNoteSchema, req.body);
    const note = await noteService.update(
      req.user!.sub,
      req.params.id as string,
      data,
    );
    res.json({ note });
  });

  // DELETE /api/notes/:id — delete note (soft delete)
  router.delete('/:id', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await noteService.delete(req.user!.sub, id);
    res.json({ id });
  });

  return router;
}
