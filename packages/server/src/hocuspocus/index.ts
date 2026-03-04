import type { Server as HTTPServer } from 'node:http';
import { Hocuspocus } from '@hocuspocus/server';
import { WebSocketServer } from 'ws';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { PrismaPersistence } from './persistence.js';
import { onAuthenticate } from './auth.js';

export function setupHocuspocus(httpServer: HTTPServer): { destroy(): Promise<void> } {
  const hocuspocus = new Hocuspocus({
    debounce: 2000,
    maxDebounce: 10000,
    quiet: true,
    onAuthenticate,
    extensions: [new PrismaPersistence()],
  });

  const wss = new WebSocketServer({ noServer: true, maxPayload: 1 * 1024 * 1024 });
  const allowedOrigin = new URL(config.clientUrl).origin;

  httpServer.on('upgrade', (request, socket, head) => {
    const url = request.url ?? '';
    const origin = request.headers.origin;

    if (origin && origin !== allowedOrigin) {
      logger.warn({ origin, allowedOrigin }, 'WebSocket upgrade rejected: origin mismatch');
      socket.destroy();
      return;
    }

    if (url.startsWith('/collaboration')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        hocuspocus.handleConnection(ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  logger.info('Hocuspocus WebSocket server attached on /collaboration');

  return {
    async destroy() {
      hocuspocus.closeConnections();
      await new Promise<void>((resolve) => {
        if (hocuspocus.getDocumentsCount() === 0) {
          resolve();
          return;
        }
        const timeout = setTimeout(() => {
          clearInterval(interval);
          logger.warn('Hocuspocus destroy timed out, proceeding with shutdown');
          resolve();
        }, 30_000);
        const interval = setInterval(() => {
          if (hocuspocus.getDocumentsCount() === 0) {
            clearTimeout(timeout);
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
      logger.info('Hocuspocus destroyed, pending documents flushed');
    },
  };
}
