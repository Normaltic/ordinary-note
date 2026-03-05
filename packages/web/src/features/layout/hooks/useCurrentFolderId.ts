import { useMatch } from 'react-router-dom';
import { useNoteQuery } from '../../../hooks/queries/useNote';

export function useCurrentFolderId(): string | null {
  const folderMatch = useMatch('/folders/:folderId');
  const noteMatch = useMatch('/notes/:noteId');
  const noteId = noteMatch?.params.noteId ?? null;
  const { data: note } = useNoteQuery(noteId);

  return (
    folderMatch?.params.folderId ??
    (noteMatch ? (note?.folderId ?? null) : null) ??
    null
  );
}
