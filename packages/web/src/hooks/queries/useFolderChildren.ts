import { useQuery, skipToken } from '@tanstack/react-query';
import type { FolderSummary, NoteSummary } from '@ordinary-note/shared';
import { fetchFolderChildren } from '../../lib/api/folders';
import { folderKeys } from './keys';
import { useFolderTree, buildRootFolderSummaries } from './useFolderTree';

interface FolderChildrenResult {
  folders: FolderSummary[];
  notes: NoteSummary[];
  isLoading: boolean;
}

export function useFolderChildren(folderId: string | null): FolderChildrenResult {
  const treeQuery = useFolderTree();

  const childrenQuery = useQuery({
    queryKey: folderKeys.children(folderId),
    queryFn: folderId !== null ? () => fetchFolderChildren(folderId) : skipToken,
  });

  if (folderId === null) {
    return {
      folders: treeQuery.data ? buildRootFolderSummaries(treeQuery.data) : [],
      notes: [],
      isLoading: treeQuery.isLoading,
    };
  }

  return {
    folders: childrenQuery.data?.folders ?? [],
    notes: childrenQuery.data?.notes ?? [],
    isLoading: childrenQuery.isLoading,
  };
}
