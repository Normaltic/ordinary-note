import type { Server as HTTPServer } from 'node:http';
import { Hocuspocus } from '@hocuspocus/server';
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

  httpServer.on('upgrade', (request, socket, head) => {
    const url = request.url ?? '';

    if (url.startsWith('/collaboration')) {
      hocuspocus.handleConnection(socket as any, request, head as any);
    } else {
      socket.destroy();
    }
  });

  logger.info('Hocuspocus WebSocket server attached on /collaboration');

  return hocuspocus;
}
