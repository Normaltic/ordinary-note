import { Router, type Request, type Response } from 'express';
import { createNoteSchema, updateNoteSchema } from '@ordinary-note/shared';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../utils/validate.js';
import type { NoteService } from '../services/note.service.js';

export function createNoteRoutes(noteService: NoteService) {
  const router: Router = Router();
  router.use(authenticate);

  // GET /api/notes/:id — get note detail
  router.get('/:id', async (req: Request, res: Response) => {
    const note = await noteService.getById(req.user!.sub, req.params.id as string);
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
    const note = await noteService.update(req.user!.sub, req.params.id as string, data);
    res.json({ note });
  });

  // DELETE /api/notes/:id — delete note (soft delete)
  router.delete('/:id', async (req: Request, res: Response) => {
    await noteService.delete(req.user!.sub, req.params.id as string);
    res.json({ success: true });
  });

  return router;
}
