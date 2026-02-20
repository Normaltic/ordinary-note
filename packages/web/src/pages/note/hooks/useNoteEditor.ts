import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '../../../stores/note.store';
import { useFolderStore } from '../../../stores/folder.store';
import { useToastStore } from '../../../stores/toast.store';
import { useAutoSave } from '../../../hooks/useAutoSave';
import * as noteApi from '../../../lib/api/notes';

export function useNoteEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const note = useNoteStore((s) => s.note);
  const loading = useNoteStore((s) => s.loading);
  const saving = useNoteStore((s) => s.saving);
  const fetchNote = useNoteStore((s) => s.fetchNote);
  const saveNote = useNoteStore((s) => s.saveNote);
  const clearNote = useNoteStore((s) => s.clearNote);
  const invalidate = useFolderStore((s) => s.invalidate);
  const addToast = useToastStore((s) => s.addToast);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (noteId) fetchNote(noteId);
    return () => clearNote();
  }, [noteId, fetchNote, clearNote]);

  // Initialize local state when note loads
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.contentPlain ?? '');
    }
  }, [note?.id]);

  // Auto-save
  useAutoSave(
    () => {
      if (noteId && note) {
        saveNote(noteId, { title, contentPlain: content });
      }
    },
    [title, content],
    1000,
  );

  const handleDelete = async () => {
    setConfirmOpen(false);
    if (!noteId || !note) return;
    try {
      await noteApi.deleteNote(noteId);
      addToast('success', '노트가 삭제되었습니다');
      await invalidate(note.folderId);
      navigate(`/folders/${note.folderId}`);
    } catch {
      addToast('error', '노트 삭제에 실패했습니다');
    }
  };

  return {
    note,
    loading,
    saving,
    title,
    setTitle,
    content,
    setContent,
    handleDelete,
    confirmOpen,
    setConfirmOpen,
  };
}
