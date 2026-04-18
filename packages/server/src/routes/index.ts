import { Router } from 'express';
import type { AuthService } from '../services/auth.service.js';
import type { CollaborationServer } from '../collaboration/index.js';
import type { FolderService } from '../services/folder.service.js';
import type { NoteService } from '../services/note.service.js';
import type { OAuthService } from '../services/oauth.service.js';
import type { AttachmentService } from '../services/attachment.service.js';
import { createAuthRoutes } from './auth.routes.js';
import { createContentRoutes } from './content.routes.js';
import { createFolderRoutes } from './folder.routes.js';
import { createNoteRoutes } from './note.routes.js';
import { createAttachmentRoutes } from './attachment.routes.js';

export type AppServices = {
  authService: AuthService;
  folderService: FolderService;
  noteService: NoteService;
  oauthService: OAuthService;
  attachmentService: AttachmentService;
  getCollaboration: () => CollaborationServer;
};

export function createRouter(services: AppServices) {
  const router: Router = Router();

  router.use('/auth', createAuthRoutes(services.authService));
  router.use(
    '/folders',
    createFolderRoutes(services.folderService, services.noteService),
  );
  router.use(
    '/notes',
    createContentRoutes({
      noteService: services.noteService,
      getCollaboration: services.getCollaboration,
    }),
  );
  router.use('/notes', createNoteRoutes(services.noteService));
  router.use('/attachments', createAttachmentRoutes(services.attachmentService));

  return router;
}
