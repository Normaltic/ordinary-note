import 'dotenv/config';
import { createServer } from 'node:http';
import { prisma } from './utils/prisma.js';
import { logger } from './utils/logger.js';
import {
  UserRepository,
  RefreshTokenRepository,
} from './repositories/index.js';
import { AuthService } from './services/index.js';
import { createApp } from './app.js';

const PORT = process.env.PORT || 3001;

async function main() {
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
  logger.info('Database connected, foreign keys enabled');

  // Composition root
  const authService = new AuthService(
    new UserRepository(),
    new RefreshTokenRepository(),
  );

  const app = createApp({ authService });
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
