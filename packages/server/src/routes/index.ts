import { Router } from 'express';
import type { AuthService } from '../services/auth.service.js';
import type { FolderService } from '../services/folder.service.js';
import type { NoteService } from '../services/note.service.js';
import { createAuthRoutes } from './auth.routes.js';
import { createFolderRoutes } from './folder.routes.js';
import { createNoteRoutes } from './note.routes.js';

export type AppServices = {
  authService: AuthService;
  folderService: FolderService;
  noteService: NoteService;
};

export function createRouter(services: AppServices) {
  const router: Router = Router();

  router.use('/auth', createAuthRoutes(services.authService));
  router.use(
    '/folders',
    createFolderRoutes(services.folderService, services.noteService),
  );
  router.use('/notes', createNoteRoutes(services.noteService));

  return router;
}
