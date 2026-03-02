import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { FolderTreeNode, FolderSummary } from '@ordinary-note/shared';
import { fetchFolderTree } from '../../lib/api/folders';
import { folderKeys } from './keys';

// ── Pure utility functions (extracted from folder.store) ──

function buildParentMap(tree: FolderTreeNode[], map: Map<string, string | null>) {
  for (const node of tree) {
    map.set(node.id, node.parentId);
    buildParentMap(node.children, map);
  }
}

export function buildAncestorPath(tree: FolderTreeNode[], folderId: string | null): string[] {
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

export function findParentId(tree: FolderTreeNode[], targetId: string): string | null {
  for (const node of tree) {
    if (node.children.some((c) => c.id === targetId)) return node.id;
    const found = findParentId(node.children, targetId);
    if (found !== null) return found;
  }
  return null;
}

export function buildRootFolderSummaries(tree: FolderTreeNode[]): FolderSummary[] {
  return tree.map((node) => ({
    id: node.id,
    name: node.name,
    sortOrder: node.sortOrder,
    childCount: node.children.length,
    noteCount: node.noteCount,
  }));
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

// ── Folder path (breadcrumb) ──

export interface BreadcrumbSegment {
  id: string;
  name: string;
}

function buildFolderPath(tree: FolderTreeNode[], folderId: string | null): BreadcrumbSegment[] {
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
