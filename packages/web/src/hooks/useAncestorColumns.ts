import { useMemo } from 'react';
import type { FolderTreeNode } from '@ordinary-note/shared';
import { useFolderStore } from '../stores/folder.store';

export interface ColumnItem {
  id: string;
  name: string;
  noteCount: number;
}

export interface ColumnData {
  parentId: string | null;
  items: ColumnItem[];
  activeId: string | null;
}

function buildIdMap(
  tree: FolderTreeNode[],
  map: Map<string, { name: string; parentId: string | null; noteCount: number }>,
) {
  for (const node of tree) {
    map.set(node.id, { name: node.name, parentId: node.parentId, noteCount: node.noteCount });
    buildIdMap(node.children, map);
  }
}

function findChildren(tree: FolderTreeNode[], parentId: string | null): ColumnItem[] {
  if (parentId === null) {
    return tree.map((n) => ({ id: n.id, name: n.name, noteCount: n.noteCount }));
  }
  const node = findNode(tree, parentId);
  if (!node) return [];
  return node.children.map((n) => ({ id: n.id, name: n.name, noteCount: n.noteCount }));
}

function findNode(tree: FolderTreeNode[], id: string): FolderTreeNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

export function useAncestorColumns(folderId: string | null): ColumnData[] {
  const tree = useFolderStore((s) => s.tree);

  return useMemo(() => {
    if (!folderId || tree.length === 0) return [];

    const map = new Map<string, { name: string; parentId: string | null; noteCount: number }>();
    buildIdMap(tree, map);

    // Build ancestor path: [root, ..., grandparent, parent, current]
    const path: string[] = [];
    let currentId: string | null = folderId;
    while (currentId) {
      const entry = map.get(currentId);
      if (!entry) break;
      path.unshift(currentId);
      currentId = entry.parentId;
    }

    // No parent → no columns (root-level folder or not found)
    if (path.length <= 1) return [];

    const columns: ColumnData[] = [];

    // Root column: root-level siblings with path[0] highlighted
    columns.push({
      parentId: null,
      items: findChildren(tree, null),
      activeId: path[0],
    });

    // Column for each ancestor except the last (current folder)
    for (let i = 0; i < path.length - 1; i++) {
      columns.push({
        parentId: path[i],
        items: findChildren(tree, path[i]),
        activeId: path[i + 1],
      });
    }

    return columns;
  }, [tree, folderId]);
}
