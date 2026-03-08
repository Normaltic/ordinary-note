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
import { registerNoteTools } from './note.tools.js';
import {
  createMockCollaboration,
  createMockNoteService,
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

describe('Note Tools', () => {
  let client: Client;
  let mcpServer: McpServer;
  let noteService: ReturnType<typeof createMockNoteService>;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  beforeEach(async () => {
    noteService = createMockNoteService();
    mcpServer = new McpServer({ name: 'test', version: '0.0.1' });
    registerNoteTools(
      mcpServer,
      noteService as unknown as Parameters<typeof registerNoteTools>[1],
      (() => createMockCollaboration()) as unknown as Parameters<typeof registerNoteTools>[2],
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

  it('list_notes — 폴더의 노트 목록을 반환한다', async () => {
    const notes = [fixtures.note(), fixtures.note({ id: 'note-2' })];
    noteService.getByFolderId.mockResolvedValue(notes);

    const result = await client.callTool({
      name: 'list_notes',
      arguments: { folderId: 'folder-1' },
    });
    const parsed = JSON.parse(
      (result.content as Array<{ type: string; text: string }>)[0].text,
    );
    expect(parsed).toHaveLength(2);
    expect(noteService.getByFolderId).toHaveBeenCalledWith(
      'user-1',
      'folder-1',
    );
  });

  it('get_note — 노트 상세 정보를 반환한다', async () => {
    noteService.getById.mockResolvedValue(fixtures.note());

    const result = await client.callTool({
      name: 'get_note',
      arguments: { noteId: 'note-1' },
    });
    const parsed = JSON.parse(
      (result.content as Array<{ type: string; text: string }>)[0].text,
    );
    expect(parsed.id).toBe('note-1');
    expect(parsed.title).toBe('Test Note');
    expect(parsed.contentPlain).toBe('Some content');
  });

  it('create_note — 새 노트를 생성한다', async () => {
    noteService.create.mockResolvedValue(fixtures.note());

    const result = await client.callTool({
      name: 'create_note',
      arguments: { folderId: 'folder-1', title: 'New Note' },
    });
    const parsed = JSON.parse(
      (result.content as Array<{ type: string; text: string }>)[0].text,
    );
    expect(parsed.id).toBe('note-1');
    expect(noteService.create).toHaveBeenCalledWith('user-1', {
      folderId: 'folder-1',
      title: 'New Note',
    });
  });

  it('update_note — 노트를 수정한다', async () => {
    noteService.update.mockResolvedValue(
      fixtures.note({ title: 'Updated', isPinned: true }),
    );

    const result = await client.callTool({
      name: 'update_note',
      arguments: { noteId: 'note-1', title: 'Updated', isPinned: true },
    });
    const parsed = JSON.parse(
      (result.content as Array<{ type: string; text: string }>)[0].text,
    );
    expect(parsed.title).toBe('Updated');
    expect(noteService.update).toHaveBeenCalledWith('user-1', 'note-1', {
      title: 'Updated',
      isPinned: true,
    });
  });

  it('delete_note — 노트를 삭제한다', async () => {
    noteService.delete.mockResolvedValue(undefined);

    const result = await client.callTool({
      name: 'delete_note',
      arguments: { noteId: 'note-1' },
    });
    const parsed = JSON.parse(
      (result.content as Array<{ type: string; text: string }>)[0].text,
    );
    expect(parsed).toEqual({ deleted: true, id: 'note-1' });
  });

  it('move_note — 노트를 다른 폴더로 이동한다', async () => {
    noteService.update.mockResolvedValue(
      fixtures.note({ folderId: 'folder-2' }),
    );

    await client.callTool({
      name: 'move_note',
      arguments: { noteId: 'note-1', folderId: 'folder-2' },
    });
    expect(noteService.update).toHaveBeenCalledWith('user-1', 'note-1', {
      folderId: 'folder-2',
    });
  });

  it('search_notes — 노트를 검색한다', async () => {
    const notes = [fixtures.note()];
    noteService.search.mockResolvedValue(notes);

    const result = await client.callTool({
      name: 'search_notes',
      arguments: { query: 'test', limit: 10 },
    });
    const parsed = JSON.parse(
      (result.content as Array<{ type: string; text: string }>)[0].text,
    );
    expect(parsed).toHaveLength(1);
    expect(noteService.search).toHaveBeenCalledWith('user-1', 'test', 10);
  });

  it('에러 발생 시 isError: true를 반환한다', async () => {
    const { NotFoundError } = await import('../../utils/errors.js');
    noteService.getById.mockRejectedValue(new NotFoundError('Note'));

    const result = await client.callTool({
      name: 'get_note',
      arguments: { noteId: 'nonexistent' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toBe('Note not found');
  });
});
