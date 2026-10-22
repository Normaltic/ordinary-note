import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../utils/config.js', () => ({
  config: {
    jwt: {
      accessSecret: 'test-access-secret',
      refreshSecret: 'test-refresh-secret',
      accessExpiresIn: '1h',
      refreshExpiresIn: '14d',
      refreshMaxAge: 14 * 24 * 60 * 60 * 1000,
    },
  },
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { registerResources } from './resources.js';
import {
  createMockNoteService,
  fixtures,
  generateTestAccessToken,
} from '../testing/helpers.js';

describe('MCP Resources', () => {
  let client: Client;
  let mcpServer: McpServer;
  let noteService: ReturnType<typeof createMockNoteService>;
  let noteContentService: { getMarkdown: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    noteService = createMockNoteService();
    noteContentService = { getMarkdown: vi.fn() };
    mcpServer = new McpServer({ name: 'test', version: '0.0.1' });
    registerResources(
      mcpServer,
      noteService as unknown as Parameters<typeof registerResources>[1],
      noteContentService as unknown as Parameters<typeof registerResources>[2],
    );

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const authInfo: AuthInfo = {
      token: generateTestAccessToken(undefined, 'mcp'),
      clientId: 'test-client',
      scopes: [],
    };
    const originalSend = clientTransport.send.bind(clientTransport);
    clientTransport.send = (message, options) =>
      originalSend(message, { ...options, authInfo });

    client = new Client({ name: 'test-client', version: '0.0.1' });
    await mcpServer.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    await mcpServer.close();
  });

  it('note:// — 제목과 마크다운 본문을 반환한다', async () => {
    noteService.getById.mockResolvedValue(fixtures.note({ title: '회의록' }));
    noteContentService.getMarkdown.mockResolvedValue('- **결정** 사항');

    const result = await client.readResource({ uri: 'note://note-1' });

    expect(result.contents[0]).toMatchObject({
      mimeType: 'text/markdown',
      text: '# 회의록\n\n- **결정** 사항',
    });
    expect(noteContentService.getMarkdown).toHaveBeenCalledWith(
      'user-1',
      'note-1',
    );
  });
});
