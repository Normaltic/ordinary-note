import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { NoteService } from '../../services/note.service.js';
import type { NoteContentService } from '../../services/note-content.service.js';
import type { FolderService } from '../../services/folder.service.js';
import type { BulkNoteService } from '../../services/bulk-note.service.js';
import { getUserId, withErrorHandling, jsonResult } from '../utils.js';
import { buildFolderPathMap } from '../../utils/folder-tree.js';
import { buildSnippet, toNoteSummary } from '../note-summary.js';

export function registerNoteTools(
  server: McpServer,
  noteService: NoteService,
  noteContentService: NoteContentService,
  folderService: FolderService,
  bulkNoteService: BulkNoteService,
): void {
  async function getFolderPaths(userId: string) {
    return buildFolderPathMap(await folderService.getTree(userId));
  }

  server.tool(
    'list_notes',
    '폴더의 노트 목록을 조회합니다 (본문 제외). recursive로 하위 폴더 노트까지 한 번에 조회합니다',
    {
      folderId: z.string().describe('폴더 ID (list_folders로 조회)'),
      recursive: z
        .boolean()
        .optional()
        .describe(
          'true면 모든 하위 폴더의 노트 포함, 최근 수정순 + folderPath 표시 (기본 false)',
        ),
    },
    async ({ folderId, recursive }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        if (!recursive) {
          const notes = await noteService.getByFolderId(userId, folderId);
          return jsonResult(notes.map(toNoteSummary));
        }
        const [notes, paths] = await Promise.all([
          noteService.getByFolderIdRecursive(userId, folderId),
          getFolderPaths(userId),
        ]);
        return jsonResult(
          notes.map((n) => ({
            ...toNoteSummary(n),
            folderPath: paths.get(n.folderId) ?? null,
          })),
        );
      }),
  );

  server.tool(
    'get_note',
    '노트 상세 정보와 본문(contentMarkdown)을 조회합니다',
    {
      noteId: z
        .string()
        .describe('노트 ID (list_notes 또는 search_notes로 조회)'),
    },
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
      folderId: z.string().describe('노트를 만들 폴더 ID'),
      title: z.string().optional().describe('노트 제목 (생략 시 빈 제목)'),
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

  // 스키마 인스턴스를 공유하면 JSON Schema 변환 시 $ref가 생기므로 매번 새로 생성
  const folderPath = () =>
    z
      .array(z.string().min(1))
      .describe('parentFolderId 기준 상대 폴더 경로. 예: ["과업", "S01 개요"]');

  server.tool(
    'create_notes',
    '여러 노트를 폴더 구조와 함께 한 번에 생성합니다. 경로상 폴더가 없으면 만들고 같은 이름이 있으면 재사용합니다. ' +
      '항목별로 독립 처리되며 실패한 항목만 error로 표시됩니다 (실패 항목만 재시도하세요). 요청 전체 1MB 이내',
    {
      parentFolderId: z.string().describe('기준 폴더 ID (list_folders로 조회)'),
      notes: z
        .array(
          z.object({
            title: z.string().optional().describe('노트 제목'),
            content: z.string().optional().describe('노트 본문 (마크다운)'),
            folder: folderPath()
              .optional()
              .describe(
                '노트를 둘 폴더 경로 (생략 시 parentFolderId 바로 아래)',
              ),
          }),
        )
        .max(100)
        .describe('생성할 노트 (최대 100개)'),
      folders: z
        .array(folderPath())
        .max(100)
        .optional()
        .describe('노트 없이 만들 폴더 경로 목록'),
    },
    async (args, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const result = await bulkNoteService.create(userId, args);
        return jsonResult(result);
      }),
  );

  server.tool(
    'write_note',
    '노트 본문 전체를 마크다운으로 교체합니다. 기존 본문은 모두 삭제됩니다. ' +
      '일부만 수정할 때는 edit_note를 사용하세요',
    {
      noteId: z.string().describe('노트 ID'),
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
    'append_note',
    '노트 본문 끝에 마크다운을 덧붙입니다. 일지·작업 로그 누적에 사용하세요 (기존 내용 매칭 불필요)',
    {
      noteId: z.string().describe('노트 ID'),
      content: z.string().describe('추가할 내용 (마크다운)'),
    },
    async ({ noteId, content }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        await noteContentService.append(userId, noteId, content);
        return jsonResult({ appended: true, id: noteId });
      }),
  );

  server.tool(
    'update_note',
    '노트의 제목·핀 고정 여부를 수정합니다. 본문은 write_note/edit_note를 사용하세요',
    {
      noteId: z.string().describe('노트 ID'),
      title: z.string().optional().describe('새 제목'),
      isPinned: z
        .boolean()
        .optional()
        .describe('핀 고정 여부 (고정 시 목록 상단에 표시)'),
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
    '노트를 휴지통으로 이동합니다 (restore_note로 복원 가능)',
    { noteId: z.string().describe('노트 ID') },
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
    {
      noteId: z.string().describe('노트 ID'),
      folderId: z.string().describe('이동할 대상 폴더 ID'),
    },
    async ({ noteId, folderId }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const note = await noteService.update(userId, noteId, { folderId });
        return jsonResult(note);
      }),
  );

  server.tool(
    'search_notes',
    '제목과 본문에서 검색어를 포함한 노트를 최근 수정순으로 찾습니다. ' +
      '결과에는 본문 대신 검색어 주변 발췌(snippet)가 포함됩니다',
    {
      query: z.string().describe('검색어 (부분 일치, 대소문자 구분 없음)'),
      limit: z.number().optional().describe('최대 결과 수 (기본 20)'),
      folderId: z
        .string()
        .optional()
        .describe('이 폴더와 하위 폴더 안에서만 검색 (생략 시 전체)'),
    },
    async ({ query, limit, folderId }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const [notes, paths] = await Promise.all([
          noteService.search(userId, query, limit, folderId),
          getFolderPaths(userId),
        ]);
        return jsonResult(
          notes.map((n) => ({
            ...toNoteSummary(n),
            folderPath: paths.get(n.folderId) ?? null,
            snippet: buildSnippet(n.contentPlain, query),
          })),
        );
      }),
  );

  server.tool(
    'list_deleted_notes',
    '삭제된 노트(휴지통) 목록을 조회합니다',
    { limit: z.number().optional().describe('최대 결과 수 (기본 50)') },
    async ({ limit }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const notes = await noteService.getDeleted(userId, limit);
        return jsonResult(
          notes.map((n) => ({
            ...toNoteSummary(n),
            folderName: n.folder?.name ?? null,
            deletedAt: n.deletedAt,
          })),
        );
      }),
  );

  server.tool(
    'restore_note',
    '휴지통의 노트를 복원합니다',
    { noteId: z.string().describe('노트 ID (list_deleted_notes로 조회)') },
    async ({ noteId }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const note = await noteService.restore(userId, noteId);
        return jsonResult(note);
      }),
  );

  server.tool(
    'permanent_delete_note',
    '휴지통의 노트를 영구 삭제합니다. 되돌릴 수 없습니다',
    { noteId: z.string().describe('노트 ID (list_deleted_notes로 조회)') },
    async ({ noteId }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        await noteService.permanentDelete(userId, noteId);
        return jsonResult({ deleted: true, id: noteId });
      }),
  );

  server.tool(
    'empty_trash',
    '휴지통의 모든 노트를 영구 삭제합니다. 되돌릴 수 없습니다',
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
      noteId: z.string().describe('노트 ID'),
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
