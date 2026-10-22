import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FolderService } from '../../services/folder.service.js';
import { getUserId, withErrorHandling, jsonResult } from '../utils.js';

export function registerFolderTools(
  server: McpServer,
  folderService: FolderService,
): void {
  server.tool(
    'list_folders',
    '전체 폴더 트리 구조를 조회합니다. 다른 도구에 필요한 folderId를 얻을 때 사용합니다',
    {},
    async (_args, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const tree = await folderService.getTree(userId);
        return jsonResult(tree);
      }),
  );

  server.tool(
    'create_folder',
    '새 폴더를 생성합니다',
    {
      name: z.string().describe('폴더 이름'),
      parentId: z
        .string()
        .optional()
        .describe('상위 폴더 ID (생략 시 최상위에 생성)'),
    },
    async (args, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const folder = await folderService.create(userId, args);
        return jsonResult(folder);
      }),
  );

  server.tool(
    'update_folder',
    '폴더 이름·정렬 순서를 수정합니다. 위치 변경은 move_folder를 사용하세요',
    {
      folderId: z.string().describe('수정할 폴더 ID'),
      name: z.string().optional().describe('새 폴더 이름'),
      sortOrder: z
        .number()
        .optional()
        .describe('같은 상위 폴더 내 정렬 순서 (작을수록 앞)'),
    },
    async ({ folderId, ...data }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const folder = await folderService.update(userId, folderId, data);
        return jsonResult(folder);
      }),
  );

  server.tool(
    'delete_folder',
    '폴더와 모든 하위 폴더를 삭제합니다. 포함된 노트는 휴지통으로 이동합니다 (restore_note로 복원 가능)',
    { folderId: z.string().describe('삭제할 폴더 ID') },
    async ({ folderId }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        await folderService.delete(userId, folderId);
        return jsonResult({ deleted: true, id: folderId });
      }),
  );

  server.tool(
    'move_folder',
    '폴더를 다른 위치로 이동합니다',
    {
      folderId: z.string().describe('이동할 폴더 ID'),
      parentId: z
        .string()
        .nullable()
        .describe('새 상위 폴더 ID (null이면 최상위로 이동)'),
    },
    async ({ folderId, parentId }, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const folder = await folderService.update(userId, folderId, {
          parentId,
        });
        return jsonResult(folder);
      }),
  );
}
