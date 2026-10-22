import { useAncestorPath } from '../../../hooks/queries/useFolder';

/**
 * 사이드바 컬럼으로 표시할 폴더 ID 목록 (null = 루트).
 * 루트부터 현재 폴더의 부모까지이며, 화면 너비에 따라 끝에서부터 잘라 표시한다.
 */
export function useColumnIds(folderId: string | null) {
  const { data: ancestorPath = [] } = useAncestorPath(folderId);
  const columnIds: (string | null)[] =
    ancestorPath.length > 0 ? [null, ...ancestorPath.slice(0, -1)] : [];

  return { columnIds, ancestorPath };
}
