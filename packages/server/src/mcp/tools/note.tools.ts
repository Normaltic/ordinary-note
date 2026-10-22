import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { NoteService } from '../../services/note.service.js';
import type { NoteContentService } from '../../services/note-content.service.js';
import { getUserId, withErrorHandling, jsonResult } from '../utils.js';

export function registerNoteTools(
  server: McpServer,
  noteService: NoteService,
  noteContentService: NoteContentService,
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
        const contentMarkdown = await noteContentService.getMarkdown(
          userId,
          noteId,
        );

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
    '새 노트를 생성합니다. content를 지정하면 본문까지 한 번에 작성합니다',
    {
      folderId: z.string(),
      title: z.string().optional(),
      content: z.string().optional().describe('노트 본문 (마크다운)'),
    },
    async ({ content, ...args }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const note = await noteService.create(userId, args);
        if (content) {
          await noteContentService.replace(userId, note.id, content);
        }
        return jsonResult(note);
      }),
  );

  server.tool(
    'write_note',
    '노트 본문 전체를 마크다운으로 교체합니다. 기존 본문은 모두 삭제됩니다. ' +
      '일부만 수정할 때는 edit_note를 사용하세요',
    {
      noteId: z.string(),
      content: z.string().describe('새 본문 전체 (마크다운)'),
    },
    async ({ noteId, content }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        await noteContentService.replace(userId, noteId, content);
        return jsonResult({ replaced: true, id: noteId });
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
        return jsonResult(
          notes.map((n) => ({
            ...n,
            folderName: n.folder?.name ?? null,
            folder: undefined,
          })),
        );
      }),
  );

  server.tool(
    'list_deleted_notes',
    '삭제된 노트(휴지통) 목록을 조회합니다',
    { limit: z.number().optional() },
    async ({ limit }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const notes = await noteService.getDeleted(userId, limit);
        return jsonResult(
          notes.map((n) => ({
            ...n,
            folderName: n.folder?.name ?? null,
            folder: undefined,
          })),
        );
      }),
  );

  server.tool(
    'restore_note',
    '삭제된 노트를 복원합니다',
    { noteId: z.string() },
    async ({ noteId }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const note = await noteService.restore(userId, noteId);
        return jsonResult(note);
      }),
  );

  server.tool(
    'permanent_delete_note',
    '삭제된 노트를 영구 삭제합니다',
    { noteId: z.string() },
    async ({ noteId }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        await noteService.permanentDelete(userId, noteId);
        return jsonResult({ deleted: true, id: noteId });
      }),
  );

  server.tool(
    'empty_trash',
    '휴지통의 모든 노트를 영구 삭제합니다',
    {},
    async (_args, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        await noteService.emptyTrash(userId);
        return jsonResult({ success: true });
      }),
  );

  server.tool(
    'edit_note',
    '노트 본문을 부분 편집합니다. content_updates 배열로 변경할 부분을 지정합니다. ' +
      'old_content는 현재 문서의 마크다운과 정확히 일치해야 하며, 문서 내 유일해야 합니다. ' +
      '고유한 매칭을 위해 주변 블록을 충분히 포함하세요. ' +
      '본문 전체를 바꿀 때는 write_note를 사용하세요.',
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
        await noteContentService.applyUpdates(userId, noteId, content_updates);

        return jsonResult({ edited: true, id: noteId });
      }),
  );
}
