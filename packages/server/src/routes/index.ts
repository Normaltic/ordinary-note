import { Router } from 'express';
import type { AuthService } from '../services/auth.service.js';
import { createAuthRoutes } from './auth.routes.js';

export type AppServices = {
  authService: AuthService;
};

export function createRouter(services: AppServices) {
  const router: Router = Router();

  router.use('/auth', createAuthRoutes(services.authService));

  return router;
}
