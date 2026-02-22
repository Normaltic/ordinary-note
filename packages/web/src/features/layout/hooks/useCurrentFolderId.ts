import { useMatch } from 'react-router-dom';
import { useNoteStore } from '../../../stores/note.store';

export function useCurrentFolderId(): string | null {
  const folderMatch = useMatch('/folders/:folderId');
  const noteMatch = useMatch('/notes/:noteId');
  const noteFolderId = useNoteStore((s) => s.note?.folderId ?? null);

  return folderMatch?.params.folderId ?? (noteMatch ? noteFolderId : null) ?? null;
}
