import type { QueryClient } from '@tanstack/react-query';

export const folderKeys = {
  all: ['folders'] as const,
  tree: () => [...folderKeys.all, 'tree'] as const,
  children: (id: string | null) => [...folderKeys.all, 'children', id ?? 'root'] as const,
};

export const noteKeys = {
  all: ['notes'] as const,
  detail: (id: string) => [...noteKeys.all, id] as const,
};

export function invalidateFolder(queryClient: QueryClient, parentId: string | null) {
  queryClient.invalidateQueries({ queryKey: folderKeys.children(parentId) });
  queryClient.invalidateQueries({ queryKey: folderKeys.tree() });
}

export function invalidateNoteInFolder(queryClient: QueryClient, folderId: string) {
  queryClient.invalidateQueries({ queryKey: folderKeys.children(folderId) });
}
