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
    '폴더 트리 구조를 조회합니다',
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
    { name: z.string(), parentId: z.string().optional() },
    async (args, { authInfo }) =>
      withErrorHandling(async () => {
        const userId = getUserId(authInfo);
        const folder = await folderService.create(userId, args);
        return jsonResult(folder);
      }),
  );

  server.tool(
    'update_folder',
    '폴더 정보를 수정합니다',
    {
      folderId: z.string(),
      name: z.string().optional(),
      parentId: z.string().nullable().optional(),
      sortOrder: z.number().optional(),
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
    '폴더를 삭제합니다',
    { folderId: z.string() },
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
    { folderId: z.string(), parentId: z.string().nullable() },
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
