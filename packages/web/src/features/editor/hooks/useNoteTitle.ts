import { useEffect, useState } from 'react';
import { useNoteQuery, useSaveNote } from '../../../hooks/queries/useNote';
import { useAutoSave } from '../../../hooks/useAutoSave';

export function useNoteTitle(noteId: string) {
  const { data: note } = useNoteQuery(noteId);
  const saveNoteMutation = useSaveNote();
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
    }
  }, [note?.id]);

  useAutoSave(
    () => {
      if (note) {
        saveNoteMutation.mutate({ id: noteId, data: { title } });
      }
    },
    [title],
    1000,
  );

  return { title, setTitle };
}
