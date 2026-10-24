import type { FolderTreeNode } from '@ordinary-note/shared';

/** 에이전트 응답용 폴더 노드. 중첩 구조로 알 수 있는 parentId·sortOrder는 생략 */
export interface CompactFolderNode {
  id: string;
  name: string;
  noteCount: number;
  children?: CompactFolderNode[];
  /** depth 제한으로 children을 생략한 경우 하위 폴더 수 */
  childCount?: number;
}

export function findFolderNode(
  tree: FolderTreeNode[],
  folderId: string,
): FolderTreeNode | null {
  for (const node of tree) {
    if (node.id === folderId) return node;
    const found = findFolderNode(node.children, folderId);
    if (found) return found;
  }
  return null;
}

/**
 * 트리를 에이전트 응답용으로 축약한다.
 * @param depth 포함할 단계 수 (1 = 최상위 노드만). 생략 시 전체
 */
export function compactTree(
  nodes: FolderTreeNode[],
  depth?: number,
): CompactFolderNode[] {
  return nodes.map((node) => {
    const compact: CompactFolderNode = {
      id: node.id,
      name: node.name,
      noteCount: node.noteCount,
    };
    if (node.children.length === 0) return compact;
    if (depth !== undefined && depth <= 1) {
      compact.childCount = node.children.length;
    } else {
      compact.children = compactTree(
        node.children,
        depth === undefined ? undefined : depth - 1,
      );
    }
    return compact;
  });
}

/** 폴더 ID → 루트부터의 이름 경로 ("A/B/C") */
export function buildFolderPathMap(
  tree: FolderTreeNode[],
  prefix = '',
  map = new Map<string, string>(),
): Map<string, string> {
  for (const node of tree) {
    const path = prefix ? `${prefix}/${node.name}` : node.name;
    map.set(node.id, path);
    buildFolderPathMap(node.children, path, map);
  }
  return map;
}
