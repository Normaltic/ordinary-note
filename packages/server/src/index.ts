import 'dotenv/config';
import { createServer } from 'node:http';
import { prisma } from './utils/prisma.js';
import { logger } from './utils/logger.js';
import {
  UserRepository,
  RefreshTokenRepository,
  FolderRepository,
  NoteRepository,
} from './repositories/index.js';
import { AuthService, FolderService, NoteService } from './services/index.js';
import { createApp } from './app.js';

const PORT = process.env.PORT || 3001;

async function main() {
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
  logger.info('Database connected, foreign keys enabled');

  // Composition root
  const userRepo = new UserRepository();
  const refreshTokenRepo = new RefreshTokenRepository();
  const folderRepo = new FolderRepository();
  const noteRepo = new NoteRepository();

  const authService = new AuthService(userRepo, refreshTokenRepo);
  const folderService = new FolderService(folderRepo);
  const noteService = new NoteService(noteRepo, folderRepo);

  const app = createApp({ authService, folderService, noteService });
  const httpServer = createServer(app);

  httpServer.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server started');
  });

  async function shutdown(signal: string) {
    logger.info({ signal }, 'Shutdown signal received');
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    logger.info('Prisma disconnected');
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal(err, 'Failed to start server');
  process.exit(1);
});
