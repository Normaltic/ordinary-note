import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useFolderStore } from '../../../stores/folder.store';

export function useFinderContents() {
  const { folderId } = useParams<{ folderId: string }>();
  const folders = useFolderStore((s) => s.folders);
  const notes = useFolderStore((s) => s.notes);
  const treeLoading = useFolderStore((s) => s.treeLoading);
  const contentsLoading = useFolderStore((s) => s.contentsLoading);
  const tree = useFolderStore((s) => s.tree);
  const fetchContents = useFolderStore((s) => s.fetchContents);
  const fetchRootContents = useFolderStore((s) => s.fetchRootContents);

  useEffect(() => {
    if (folderId) {
      fetchContents(folderId);
    } else if (tree.length > 0) {
      fetchRootContents();
    }
  }, [folderId, fetchContents, fetchRootContents, tree]);

  return {
    folderId,
    folders,
    notes,
    isLoading: treeLoading || contentsLoading,
  };
}
