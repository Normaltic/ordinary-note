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

import { Doc } from 'yjs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { registerNoteTools } from './note.tools.js';
import { NoteContentService } from '../../services/note-content.service.js';
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
  let mockCollaboration: ReturnType<typeof createMockCollaboration>;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  beforeEach(async () => {
    noteService = createMockNoteService();
    mockCollaboration = createMockCollaboration();
    mcpServer = new McpServer({ name: 'test', version: '0.0.1' });
    const typedNoteService = noteService as unknown as Parameters<
      typeof registerNoteTools
    >[1];
    registerNoteTools(
      mcpServer,
      typedNoteService,
      new NoteContentService(
        typedNoteService,
        () => mockCollaboration as never,
      ),
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

  it('get_note — 노트 상세 정보를 반환한다 (contentMarkdown 포함)', async () => {
    noteService.getById.mockResolvedValue(fixtures.note());
    const mockTransact = vi.fn<(fn: (doc: unknown) => void) => Promise<void>>(
      async (fn) => {
        const { Doc, XmlElement, XmlText } = await import('yjs');
        const doc = new Doc();
        const fragment = doc.getXmlFragment('default');
        const para = new XmlElement('paragraph');
        para.insert(0, [new XmlText('Some content')]);
        fragment.push([para]);
        fn(doc);
      },
    );
    mockCollaboration.openDirectConnection.mockResolvedValue({
      transact: mockTransact,
      disconnect: vi.fn(),
    });

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
    expect(parsed.contentMarkdown).toBe('Some content');
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

  function mockDocConnection() {
    const doc = new Doc();
    const disconnect = vi.fn();
    mockCollaboration.openDirectConnection.mockResolvedValue({
      transact: async (fn: (d: unknown) => void) => fn(doc),
      disconnect,
    });
    return { doc, disconnect };
  }

  it('create_note — content를 지정하면 본문까지 작성한다', async () => {
    noteService.create.mockResolvedValue(fixtures.note());
    noteService.getById.mockResolvedValue(fixtures.note());
    const { doc } = mockDocConnection();

    const result = await client.callTool({
      name: 'create_note',
      arguments: { folderId: 'folder-1', title: 'New', content: '# 본문' },
    });

    expect(result.isError).toBeFalsy();
    expect(noteService.create).toHaveBeenCalledWith('user-1', {
      folderId: 'folder-1',
      title: 'New',
    });
    expect(doc.getXmlFragment('default').length).toBeGreaterThan(0);
  });

  it('create_note — content가 없으면 본문에 접근하지 않는다', async () => {
    noteService.create.mockResolvedValue(fixtures.note());

    await client.callTool({
      name: 'create_note',
      arguments: { folderId: 'folder-1' },
    });

    expect(mockCollaboration.openDirectConnection).not.toHaveBeenCalled();
  });

  it('write_note — 본문 전체를 교체한다', async () => {
    noteService.getById.mockResolvedValue(fixtures.note());
    const { doc, disconnect } = mockDocConnection();

    const result = await client.callTool({
      name: 'write_note',
      arguments: { noteId: 'note-1', content: '새 본문' },
    });
    const parsed = JSON.parse(
      (result.content as Array<{ type: string; text: string }>)[0].text,
    );

    expect(parsed).toEqual({ replaced: true, id: 'note-1' });
    expect(doc.getXmlFragment('default').toString()).toContain('새 본문');
    expect(disconnect).toHaveBeenCalled();
  });

  it('write_note — 소유권 없는 노트는 NOT_FOUND 에러를 반환한다', async () => {
    const { NotFoundError } = await import('../../utils/errors.js');
    noteService.getById.mockRejectedValue(new NotFoundError('Note'));

    const result = await client.callTool({
      name: 'write_note',
      arguments: { noteId: 'nonexistent', content: 'x' },
    });

    expect(result.isError).toBe(true);
    expect(mockCollaboration.openDirectConnection).not.toHaveBeenCalled();
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

  it('search_notes — 노트를 검색한다 (folderName 포함)', async () => {
    const notes = [{ ...fixtures.note(), folder: { name: 'My Notes' } }];
    noteService.search.mockResolvedValue(notes);

    const result = await client.callTool({
      name: 'search_notes',
      arguments: { query: 'test', limit: 10 },
    });
    const parsed = JSON.parse(
      (result.content as Array<{ type: string; text: string }>)[0].text,
    );
    expect(parsed).toHaveLength(1);
    expect(parsed[0].folderName).toBe('My Notes');
    expect(parsed[0].folder).toBeUndefined();
    expect(noteService.search).toHaveBeenCalledWith('user-1', 'test', 10);
  });

  it('list_deleted_notes — 삭제된 노트 목록을 반환한다', async () => {
    const notes = [
      {
        ...fixtures.note({ deletedAt: new Date() }),
        folder: { name: 'My Notes' },
      },
    ];
    noteService.getDeleted.mockResolvedValue(notes);

    const result = await client.callTool({
      name: 'list_deleted_notes',
      arguments: { limit: 10 },
    });
    const parsed = JSON.parse(
      (result.content as Array<{ type: string; text: string }>)[0].text,
    );
    expect(parsed).toHaveLength(1);
    expect(parsed[0].folderName).toBe('My Notes');
    expect(noteService.getDeleted).toHaveBeenCalledWith('user-1', 10);
  });

  it('restore_note — 삭제된 노트를 복원한다', async () => {
    noteService.restore.mockResolvedValue(fixtures.note());

    const result = await client.callTool({
      name: 'restore_note',
      arguments: { noteId: 'note-1' },
    });
    const parsed = JSON.parse(
      (result.content as Array<{ type: string; text: string }>)[0].text,
    );
    expect(parsed.id).toBe('note-1');
    expect(noteService.restore).toHaveBeenCalledWith('user-1', 'note-1');
  });

  it('permanent_delete_note — 노트를 영구 삭제한다', async () => {
    noteService.permanentDelete.mockResolvedValue(undefined);

    const result = await client.callTool({
      name: 'permanent_delete_note',
      arguments: { noteId: 'note-1' },
    });
    const parsed = JSON.parse(
      (result.content as Array<{ type: string; text: string }>)[0].text,
    );
    expect(parsed).toEqual({ deleted: true, id: 'note-1' });
  });

  it('empty_trash — 휴지통을 비운다', async () => {
    noteService.emptyTrash.mockResolvedValue(undefined);

    const result = await client.callTool({
      name: 'empty_trash',
      arguments: {},
    });
    const parsed = JSON.parse(
      (result.content as Array<{ type: string; text: string }>)[0].text,
    );
    expect(parsed).toEqual({ success: true });
  });

  it('edit_note — 노트 콘텐츠를 부분 편집한다', async () => {
    noteService.getById.mockResolvedValue(fixtures.note());
    const mockDisconnect = vi.fn();
    const mockTransact = vi.fn<(fn: (doc: unknown) => void) => Promise<void>>(
      async (fn) => {
        const { Doc, XmlElement, XmlText } = await import('yjs');
        const doc = new Doc();
        const fragment = doc.getXmlFragment('default');
        // Set up existing content: a paragraph with "Hello world"
        const para = new XmlElement('paragraph');
        para.insert(0, [new XmlText('Hello world')]);
        fragment.push([para]);
        fn(doc);
      },
    );
    mockCollaboration.openDirectConnection.mockResolvedValue({
      transact: mockTransact,
      disconnect: mockDisconnect,
    });

    const result = await client.callTool({
      name: 'edit_note',
      arguments: {
        noteId: 'note-1',
        content_updates: [
          { old_content: 'Hello world', new_content: 'Hello universe' },
        ],
      },
    });

    const parsed = JSON.parse(
      (result.content as Array<{ type: string; text: string }>)[0].text,
    );
    expect(parsed).toEqual({ edited: true, id: 'note-1' });
    expect(noteService.getById).toHaveBeenCalledWith('user-1', 'note-1');
    expect(mockCollaboration.openDirectConnection).toHaveBeenCalledWith(
      'note-1',
    );
    expect(mockTransact).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('edit_note — 소유권 없는 노트에 대해 isError를 반환한다', async () => {
    const { NotFoundError } = await import('../../utils/errors.js');
    noteService.getById.mockRejectedValue(new NotFoundError('Note'));

    const result = await client.callTool({
      name: 'edit_note',
      arguments: {
        noteId: 'nonexistent',
        content_updates: [{ old_content: 'test', new_content: 'replacement' }],
      },
    });

    expect(result.isError).toBe(true);
    expect(mockCollaboration.openDirectConnection).not.toHaveBeenCalled();
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
    expect(JSON.parse(text).error).toEqual({
      code: 'RESOURCE_NOT_FOUND',
      message: 'Note not found',
    });
  });
});
