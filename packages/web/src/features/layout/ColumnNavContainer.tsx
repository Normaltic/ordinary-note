import { useShallow } from 'zustand/react/shallow';
import { useMatch, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const standalone = searchParams.has('standalone');
  const isNoteRoute = !!useMatch('/notes/:noteId');

  return (
    <ColumnNav
      open={open}
      onClose={onClose}
      ancestorPath={ancestorPath}
      standalone={standalone}
      compact={isNoteRoute}
    />
  );
}
