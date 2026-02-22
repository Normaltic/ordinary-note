import { useShallow } from 'zustand/react/shallow';
import { useFolderStore, selectAncestorPath } from '../../stores/folder.store';
import { useCurrentFolderId } from './hooks/useCurrentFolderId';
import { ColumnNav } from './components/ColumnNav';

interface ColumnNavContainerProps {
  open: boolean;
  onClose: () => void;
}

export function ColumnNavContainer({ open, onClose }: ColumnNavContainerProps) {
  const folderId = useCurrentFolderId();
  const ancestorPath = useFolderStore(useShallow(selectAncestorPath(folderId)));

  return <ColumnNav open={open} onClose={onClose} ancestorPath={ancestorPath} />;
}
