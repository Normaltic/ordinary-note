import { createServer } from 'node:http';
import { app } from './app.js';
import { prisma } from './utils/prisma.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 3001;

async function main() {
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
  logger.info('Database connected, foreign keys enabled');

  const httpServer = createServer(app);

  httpServer.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server started');
  });

  async function shutdown(signal: string) {
    logger.info({ signal }, 'Shutdown signal received');
    httpServer.close(() => {
      logger.info('HTTP server closed');
    });
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
