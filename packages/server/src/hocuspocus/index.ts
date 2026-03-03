import type { Server as HTTPServer } from 'node:http';
import { Hocuspocus } from '@hocuspocus/server';
import { WebSocketServer } from 'ws';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { PrismaPeristence } from './persistence.js';
import { onAuthenticate } from './auth.js';

export function setupHocuspocus(httpServer: HTTPServer): Hocuspocus {
  const hocuspocus = new Hocuspocus({
    debounce: 2000,
    maxDebounce: 10000,
    quiet: true,
    onAuthenticate,
    extensions: [new PrismaPeristence()],
  });

  const wss = new WebSocketServer({ noServer: true });
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

  return hocuspocus;
}
