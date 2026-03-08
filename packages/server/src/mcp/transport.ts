import { Router } from 'express';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export function createMcpRoutes(mcpServerFactory: () => McpServer): Router {
  const router = Router();

  router.use(authenticate('mcp'));

  router.post('/', async (req, res) => {
    const server = mcpServerFactory();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  router.get('/', (_req, res) => {
    res.status(405).end();
  });

  router.delete('/', (_req, res) => {
    res.status(405).end();
  });

  return router;
}
