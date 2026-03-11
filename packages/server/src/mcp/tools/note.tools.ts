import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CollaborationServer } from '../../collaboration/index.js';
import type { NoteService } from '../../services/note.service.js';
import { getUserId, withErrorHandling, jsonResult } from '../utils.js';
import { yFragmentToMarkdown } from '../../utils/markdown/yjs-to-markdown.js';
import { applyContentUpdates } from '../../utils/markdown/content-updater.js';

export function registerNoteTools(
  server: McpServer,
  noteService: NoteService,
  getCollaboration: () => CollaborationServer,
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

        // Yjs 문서에서 마크다운 변환
        let contentMarkdown = '';
        const collaboration = getCollaboration();
        const connection = await collaboration.openDirectConnection(noteId);
        try {
          await connection.transact((doc) => {
            const fragment = doc.getXmlFragment('default');
            contentMarkdown = yFragmentToMarkdown(fragment);
          });
        } finally {
          await connection.disconnect();
        }

        return jsonResult({
          id: note.id,
          title: note.title,
          contentMarkdown,
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

  server.tool(
    'edit_note',
    '노트 본문을 부분 편집합니다. content_updates 배열로 변경할 부분을 지정합니다. ' +
      'old_content는 현재 문서의 마크다운과 정확히 일치해야 하며, 문서 내 유일해야 합니다. ' +
      '고유한 매칭을 위해 주변 블록을 충분히 포함하세요. ' +
      '빈 문서에 최초 작성 시 old_content를 빈 문자열로 지정합니다.',
    {
      noteId: z.string(),
      content_updates: z.array(
        z.object({
          old_content: z.string().describe('현재 문서에서 매칭할 마크다운 텍스트'),
          new_content: z.string().describe('교체할 마크다운 텍스트 (빈 문자열 = 삭제)'),
        }),
      ),
    },
    async ({ noteId, content_updates }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        await noteService.getById(userId, noteId);

        const collaboration = getCollaboration();
        const connection = await collaboration.openDirectConnection(noteId);
        try {
          await connection.transact((doc) => {
            const fragment = doc.getXmlFragment('default');
            applyContentUpdates(fragment, content_updates);
          });
        } finally {
          await connection.disconnect();
        }

        return jsonResult({ edited: true, id: noteId });
      }),
  );
}
