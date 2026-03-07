import { useAncestorPath } from '../../../hooks/queries/useFolder';

export function useColumnIds(folderId: string | null) {
  const { data: ancestorPath = [] } = useAncestorPath(folderId);
  const columnIds = ancestorPath.length > 1 ? ancestorPath.slice(0, -1) : [];

  return { columnIds, ancestorPath };
}
