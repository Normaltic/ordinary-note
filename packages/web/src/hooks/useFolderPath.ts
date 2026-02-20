import { useMemo } from 'react';
import type { FolderTreeNode } from '@ordinary-note/shared';
import { useFolderStore } from '../stores/folder.store';

export interface BreadcrumbSegment {
  id: string;
  name: string;
}

function buildIdMap(
  tree: FolderTreeNode[],
  map: Map<string, { name: string; parentId: string | null }>,
) {
  for (const node of tree) {
    map.set(node.id, { name: node.name, parentId: node.parentId });
    buildIdMap(node.children, map);
  }
}

export function useFolderPath(folderId: string | null): BreadcrumbSegment[] {
  const tree = useFolderStore((s) => s.tree);

  return useMemo(() => {
    if (!folderId) return [];

    const map = new Map<string, { name: string; parentId: string | null }>();
    buildIdMap(tree, map);

    const segments: BreadcrumbSegment[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const entry = map.get(currentId);
      if (!entry) break;
      segments.unshift({ id: currentId, name: entry.name });
      currentId = entry.parentId;
    }

    return segments;
  }, [tree, folderId]);
}
