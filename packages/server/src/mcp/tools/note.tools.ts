import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { NoteService } from '../../services/note.service.js';
import { getUserId, withErrorHandling, jsonResult } from '../utils.js';

export function registerNoteTools(
  server: McpServer,
  noteService: NoteService,
): void {
  server.tool(
    'list_notes',
    '폴더의 노트 목록을 조회합니다',
    { folderId: z.string() },
    async ({ folderId }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const notes = await noteService.getByFolderId(userId, folderId);
        return jsonResult(notes);
      }),
  );

  server.tool(
    'get_note',
    '노트 상세 정보를 조회합니다',
    { noteId: z.string() },
    async ({ noteId }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const note = await noteService.getById(userId, noteId);
        return jsonResult({
          id: note.id,
          title: note.title,
          contentPlain: note.contentPlain,
          folderId: note.folderId,
          isPinned: note.isPinned,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        });
      }),
  );

  server.tool(
    'create_note',
    '새 노트를 생성합니다',
    { folderId: z.string(), title: z.string().optional() },
    async (args, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const note = await noteService.create(userId, args);
        return jsonResult(note);
      }),
  );

  server.tool(
    'update_note',
    '노트 정보를 수정합니다',
    {
      noteId: z.string(),
      title: z.string().optional(),
      isPinned: z.boolean().optional(),
    },
    async ({ noteId, ...data }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const note = await noteService.update(userId, noteId, data);
        return jsonResult(note);
      }),
  );

  server.tool(
    'delete_note',
    '노트를 삭제합니다',
    { noteId: z.string() },
    async ({ noteId }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        await noteService.delete(userId, noteId);
        return jsonResult({ deleted: true, id: noteId });
      }),
  );

  server.tool(
    'move_note',
    '노트를 다른 폴더로 이동합니다',
    { noteId: z.string(), folderId: z.string() },
    async ({ noteId, folderId }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const note = await noteService.update(userId, noteId, { folderId });
        return jsonResult(note);
      }),
  );

  server.tool(
    'search_notes',
    '노트를 검색합니다',
    { query: z.string(), limit: z.number().optional() },
    async ({ query, limit }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const notes = await noteService.search(userId, query, limit);
        return jsonResult(notes);
      }),
  );
}
