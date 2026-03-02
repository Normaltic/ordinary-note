import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteQuery, useSaveNote, useDeleteNote } from '../../../hooks/queries/useNote';
import { useToastStore } from '../../../stores/toast.store';
import { useAutoSave } from '../../../hooks/useAutoSave';

export function useNoteEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { data: note, isLoading: loading } = useNoteQuery(noteId ?? null);
  const saveNoteMutation = useSaveNote();
  const deleteNoteMutation = useDeleteNote();
  const addToast = useToastStore((s) => s.addToast);

  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentPlain, setContentPlain] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const contentPlainRef = useRef(contentPlain);
  contentPlainRef.current = contentPlain;

  // Initialize local state when note loads
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContentHtml(note.contentHtml ?? note.contentPlain ?? '');
      setContentPlain(note.contentPlain ?? '');
    }
  }, [note?.id]);

  const handleEditorUpdate = useCallback((html: string, plain: string) => {
    setContentHtml(html);
    setContentPlain(plain);
  }, []);

  // Auto-save
  useAutoSave(
    () => {
      if (noteId && note) {
        saveNoteMutation.mutate({
          id: noteId,
          data: {
            title,
            contentHtml,
            contentPlain: contentPlainRef.current,
          },
        });
      }
    },
    [title, contentHtml],
    1000,
  );

  const handleDelete = () => {
    setConfirmOpen(false);
    if (!noteId || !note) return;
    deleteNoteMutation.mutate(
      { id: noteId, folderId: note.folderId },
      {
        onSuccess: () => {
          addToast('success', '노트가 삭제되었습니다');
          navigate(`/folders/${note.folderId}`);
        },
        onError: () => {
          addToast('error', '노트 삭제에 실패했습니다');
        },
      },
    );
  };

  return {
    note: note ?? null,
    loading,
    saving: saveNoteMutation.isPending,
    title,
    setTitle,
    contentHtml,
    handleEditorUpdate,
    handleDelete,
    confirmOpen,
    setConfirmOpen,
  };
}
