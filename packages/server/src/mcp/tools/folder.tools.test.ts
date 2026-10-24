import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../utils/config.js', () => ({
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
import { registerFolderTools } from './folder.tools.js';
import {
  createMockFolderService,
  fixtures,
  generateTestAccessToken,
} from '../../testing/helpers.js';

function createAuthTransport(): [InMemoryTransport, InMemoryTransport] {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  const token = generateTestAccessToken(undefined, 'mcp');
  const authInfo: AuthInfo = { token, clientId: 'test-client', scopes: [] };

  const originalSend = clientTransport.send.bind(clientTransport);
  clientTransport.send = (message, options) =>
    originalSend(message, { ...options, authInfo });

  return [clientTransport, serverTransport];
}

describe('Folder Tools', () => {
  let client: Client;
  let mcpServer: McpServer;
  let folderService: ReturnType<typeof createMockFolderService>;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  beforeEach(async () => {
    folderService = createMockFolderService();
    mcpServer = new McpServer({ name: 'test', version: '0.0.1' });
    registerFolderTools(
      mcpServer,
      folderService as unknown as Parameters<typeof registerFolderTools>[1],
    );

    [clientTransport, serverTransport] = createAuthTransport();
    client = new Client({ name: 'test-client', version: '0.0.1' });
    await mcpServer.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    await mcpServer.close();
  });

  const tree = [
    {
      id: 'root',
      name: 'Root',
      parentId: null,
      sortOrder: 0,
      noteCount: 1,
      children: [
        {
          id: 'a',
          name: 'A',
          parentId: 'root',
          sortOrder: 0,
          noteCount: 2,
          children: [
            {
              id: 'a1',
              name: 'A1',
              parentId: 'a',
              sortOrder: 0,
              noteCount: 3,
              children: [],
            },
          ],
        },
      ],
    },
  ];

  async function listFolders(args: Record<string, unknown> = {}) {
    folderService.getTree.mockResolvedValue(tree);
    const result = await client.callTool({
      name: 'list_folders',
      arguments: args,
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    return { result, parsed: JSON.parse(text) };
  }

  it('list_folders — parentId·sortOrder 없이 축약된 트리를 반환한다', async () => {
    const { parsed } = await listFolders();
    expect(parsed).toEqual([
      {
        id: 'root',
        name: 'Root',
        noteCount: 1,
        children: [
          {
            id: 'a',
            name: 'A',
            noteCount: 2,
            children: [{ id: 'a1', name: 'A1', noteCount: 3 }],
          },
        ],
      },
    ]);
  });

  it('list_folders — depth로 단계를 제한하고 childCount를 표시한다', async () => {
    const { parsed } = await listFolders({ depth: 2 });
    expect(parsed[0].children[0]).toEqual({
      id: 'a',
      name: 'A',
      noteCount: 2,
      childCount: 1,
    });
  });

  it('list_folders — rootId 하위 트리만 반환한다', async () => {
    const { parsed } = await listFolders({ rootId: 'a', depth: 1 });
    expect(parsed).toEqual([
      { id: 'a', name: 'A', noteCount: 2, childCount: 1 },
    ]);
  });

  it('list_folders — 없는 rootId는 NOT_FOUND', async () => {
    const { result, parsed } = await listFolders({ rootId: 'nope' });
    expect(result.isError).toBe(true);
    expect(parsed.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('create_folder — 새 폴더를 생성한다', async () => {
    const folder = fixtures.folder({ name: 'New' });
    folderService.create.mockResolvedValue(folder);

    const result = await client.callTool({
      name: 'create_folder',
      arguments: { name: 'New' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text).name).toBe('New');
    expect(folderService.create).toHaveBeenCalledWith('user-1', {
      name: 'New',
    });
  });

  it('create_folder — parentId를 전달한다', async () => {
    folderService.create.mockResolvedValue(
      fixtures.folder({ parentId: 'parent-1' }),
    );

    await client.callTool({
      name: 'create_folder',
      arguments: { name: 'Child', parentId: 'parent-1' },
    });
    expect(folderService.create).toHaveBeenCalledWith('user-1', {
      name: 'Child',
      parentId: 'parent-1',
    });
  });

  it('update_folder — 폴더를 수정한다', async () => {
    folderService.update.mockResolvedValue(
      fixtures.folder({ name: 'Updated' }),
    );

    const result = await client.callTool({
      name: 'update_folder',
      arguments: { folderId: 'folder-1', name: 'Updated' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text).name).toBe('Updated');
    expect(folderService.update).toHaveBeenCalledWith('user-1', 'folder-1', {
      name: 'Updated',
    });
  });

  it('update_folder — parentId는 받지 않는다 (이동은 move_folder)', async () => {
    folderService.update.mockResolvedValue(fixtures.folder());

    await client.callTool({
      name: 'update_folder',
      arguments: { folderId: 'folder-1', name: 'Renamed', parentId: 'other' },
    });
    expect(folderService.update).toHaveBeenCalledWith('user-1', 'folder-1', {
      name: 'Renamed',
    });
  });

  it('delete_folder — 폴더를 삭제한다', async () => {
    folderService.delete.mockResolvedValue(undefined);

    const result = await client.callTool({
      name: 'delete_folder',
      arguments: { folderId: 'folder-1' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text)).toEqual({ deleted: true, id: 'folder-1' });
  });

  it('move_folder — 폴더를 이동한다', async () => {
    folderService.update.mockResolvedValue(
      fixtures.folder({ parentId: 'new-parent' }),
    );

    await client.callTool({
      name: 'move_folder',
      arguments: { folderId: 'folder-1', parentId: 'new-parent' },
    });
    expect(folderService.update).toHaveBeenCalledWith('user-1', 'folder-1', {
      parentId: 'new-parent',
    });
  });

  it('에러 발생 시 isError: true를 반환한다', async () => {
    const { NotFoundError } = await import('../../utils/errors.js');
    folderService.getTree.mockRejectedValue(new NotFoundError('Folder'));

    const result = await client.callTool({
      name: 'list_folders',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(JSON.parse(text).error).toEqual({
      code: 'RESOURCE_NOT_FOUND',
      message: 'Folder not found',
    });
  });
});
