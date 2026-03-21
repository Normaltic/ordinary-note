import { useCallback, useMemo } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  skipToken,
} from '@tanstack/react-query';
import type {
  FolderTreeNode,
  FolderSummary,
  NoteSummary,
  CreateFolderRequest,
} from '@ordinary-note/shared';
import { useSortStore, type SortOption } from '../../stores/sort.store';
import {
  fetchFolderTree,
  fetchFolderChildren,
  createFolder,
  updateFolder,
  deleteFolder,
} from '../../lib/api/folders';
import { folderKeys, invalidateFolder } from './keys';

// ── Pure utility functions ──

function buildParentMap(
  tree: FolderTreeNode[],
  map: Map<string, string | null>,
) {
  for (const node of tree) {
    map.set(node.id, node.parentId);
    buildParentMap(node.children, map);
  }
}

export function buildAncestorPath(
  tree: FolderTreeNode[],
  folderId: string | null,
): string[] {
  if (!folderId || tree.length === 0) return [];

  const parentMap = new Map<string, string | null>();
  buildParentMap(tree, parentMap);

  const path: string[] = [];
  let currentId: string | null = folderId;
  while (currentId) {
    if (!parentMap.has(currentId)) break;
    path.unshift(currentId);
    currentId = parentMap.get(currentId) ?? null;
  }
  return path;
}

export function findParentId(
  tree: FolderTreeNode[],
  targetId: string,
): string | null {
  for (const node of tree) {
    if (node.children.some((c) => c.id === targetId)) return node.id;
    const found = findParentId(node.children, targetId);
    if (found !== null) return found;
  }
  return null;
}

function buildRootFolderSummaries(tree: FolderTreeNode[]): FolderSummary[] {
  return tree.map((node) => ({
    id: node.id,
    name: node.name,
    sortOrder: node.sortOrder,
    childCount: node.children.length,
    noteCount: node.noteCount,
  }));
}

export interface BreadcrumbSegment {
  id: string;
  name: string;
}

function buildFolderPath(
  tree: FolderTreeNode[],
  folderId: string | null,
): BreadcrumbSegment[] {
  if (!folderId) return [];

  const map = new Map<string, { name: string; parentId: string | null }>();
  function walk(nodes: FolderTreeNode[]) {
    for (const node of nodes) {
      map.set(node.id, { name: node.name, parentId: node.parentId });
      walk(node.children);
    }
  }
  walk(tree);

  const segments: BreadcrumbSegment[] = [];
  let currentId: string | null = folderId;
  while (currentId) {
    const entry = map.get(currentId);
    if (!entry) break;
    segments.unshift({ id: currentId, name: entry.name });
    currentId = entry.parentId;
  }
  return segments;
}

// ── Query hooks ──

export function useFolderTree() {
  return useQuery({
    queryKey: folderKeys.tree(),
    queryFn: fetchFolderTree,
  });
}

export function useAncestorPath(folderId: string | null) {
  const selectFn = useCallback(
    (tree: FolderTreeNode[]) => buildAncestorPath(tree, folderId),
    [folderId],
  );
  return useQuery({
    queryKey: folderKeys.tree(),
    queryFn: fetchFolderTree,
    select: selectFn,
  });
}

export function useFolderPath(folderId: string | null): BreadcrumbSegment[] {
  const selectFn = useCallback(
    (tree: FolderTreeNode[]) => buildFolderPath(tree, folderId),
    [folderId],
  );

  const { data = [] } = useQuery({
    queryKey: folderKeys.tree(),
    queryFn: fetchFolderTree,
    select: selectFn,
  });

  return data;
}

function sortFolders(folders: FolderSummary[], sortBy: SortOption): FolderSummary[] {
  if (sortBy === 'name') {
    return [...folders].sort((a, b) => a.name.localeCompare(b.name));
  }
  return folders;
}

function sortNotes(notes: NoteSummary[], sortBy: SortOption): NoteSummary[] {
  if (sortBy === 'name') {
    return [...notes].sort((a, b) => a.title.localeCompare(b.title));
  }
  if (sortBy === 'updatedAt') {
    return [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  if (sortBy === 'createdAt') {
    return [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return notes;
}

interface FolderChildrenResult {
  folders: FolderSummary[];
  notes: NoteSummary[];
  isLoading: boolean;
}

export function useFolderChildren(
  folderId: string | null,
): FolderChildrenResult {
  const treeQuery = useFolderTree();
  const sortBy = useSortStore((s) => s.sortBy);

  const childrenQuery = useQuery({
    queryKey: folderKeys.children(folderId),
    queryFn:
      folderId !== null ? () => fetchFolderChildren(folderId) : skipToken,
  });

  const rootFolders = useMemo(
    () => treeQuery.data ? buildRootFolderSummaries(treeQuery.data) : [],
    [treeQuery.data],
  );

  const sortedRootFolders = useMemo(
    () => sortFolders(rootFolders, sortBy),
    [rootFolders, sortBy],
  );

  const rawFolders = childrenQuery.data?.folders ?? [];
  const rawNotes = childrenQuery.data?.notes ?? [];

  const sortedFolders = useMemo(
    () => sortFolders(rawFolders, sortBy),
    [rawFolders, sortBy],
  );

  const sortedNotes = useMemo(
    () => sortNotes(rawNotes, sortBy),
    [rawNotes, sortBy],
  );

  if (folderId === null) {
    return {
      folders: sortedRootFolders,
      notes: [],
      isLoading: treeQuery.isLoading,
    };
  }

  return {
    folders: sortedFolders,
    notes: sortedNotes,
    isLoading: childrenQuery.isLoading,
  };
}

// ── Mutation hooks ──

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateFolderRequest) => createFolder(params),
    onSuccess: (_data, variables) => {
      invalidateFolder(queryClient, variables.parentId ?? null);
    },
  });
}

export function useRenameFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; name: string; parentId: string | null }) =>
      updateFolder(vars.id, { name: vars.name }),
    onSuccess: (_data, variables) => {
      invalidateFolder(queryClient, variables.parentId);
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; parentId: string | null }) =>
      deleteFolder(vars.id),
    onSuccess: (_data, variables) => {
      invalidateFolder(queryClient, variables.parentId);
    },
  });
}
