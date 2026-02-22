import { useEffect, useState, useCallback } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import { useFolderStore } from '../../../stores/folder.store';
import { useNoteStore } from '../../../stores/note.store';
import { useFolderPath } from './useFolderPath';
import { useAncestorColumns } from './useAncestorColumns';

export function useAppShell() {
  const fetchTree = useFolderStore((s) => s.fetchTree);
  const createFolder = useFolderStore((s) => s.createFolder);
  const navigate = useNavigate();

  const folderMatch = useMatch('/folders/:folderId');
  const noteMatch = useMatch('/notes/:noteId');
  const note = useNoteStore((s) => s.note);

  const folderId =
    folderMatch?.params.folderId ?? (noteMatch ? note?.folderId : null) ?? null;

  const segments = useFolderPath(folderId);
  const columns = useAncestorColumns(folderId);
  const noteLabel = noteMatch ? (note?.title || '제목 없음') : undefined;

  const [navOpen, setNavOpen] = useState(false);
  const [folderPromptOpen, setFolderPromptOpen] = useState(false);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const closeNav = useCallback(() => setNavOpen(false), []);
  const toggleNav = useCallback(() => setNavOpen((v) => !v), []);

  const handleCreateFolder = useCallback(() => {
    setFolderPromptOpen(true);
  }, []);

  const handleCreateNote = useCallback(async () => {
    if (!folderId) return;
    const { createNote } = await import('../../../lib/api/notes');
    const newNote = await createNote({ folderId });
    navigate(`/notes/${newNote.id}`);
  }, [folderId, navigate]);

  const handleFolderPromptConfirm = useCallback(
    async (name: string) => {
      setFolderPromptOpen(false);
      await createFolder(name, folderId ?? undefined);
    },
    [createFolder, folderId],
  );

  const handleFolderPromptCancel = useCallback(() => {
    setFolderPromptOpen(false);
  }, []);

  return {
    folderId,
    segments,
    columns,
    noteLabel,
    navOpen,
    closeNav,
    toggleNav,
    folderPromptOpen,
    handleCreateFolder,
    handleCreateNote,
    handleFolderPromptConfirm,
    handleFolderPromptCancel,
  };
}
