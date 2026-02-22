import { useState, useCallback } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import { useFolderStore } from '../../stores/folder.store';
import { useNoteStore } from '../../stores/note.store';
import { useCurrentFolderId } from './hooks/useCurrentFolderId';
import { useFolderPath } from './hooks/useFolderPath';
import { MainHeader } from './components/MainHeader';
import { PromptDialog } from '../../components/PromptDialog';

interface MainHeaderContainerProps {
  onToggleNav: () => void;
}

export function MainHeaderContainer({ onToggleNav }: MainHeaderContainerProps) {
  const folderId = useCurrentFolderId();
  const segments = useFolderPath(folderId);
  const noteMatch = useMatch('/notes/:noteId');
  const note = useNoteStore((s) => s.note);
  const noteLabel = noteMatch ? (note?.title || '제목 없음') : undefined;

  const createFolder = useFolderStore((s) => s.createFolder);
  const navigate = useNavigate();

  const [folderPromptOpen, setFolderPromptOpen] = useState(false);

  const handleCreateFolder = useCallback(() => {
    setFolderPromptOpen(true);
  }, []);

  const handleCreateNote = useCallback(async () => {
    if (!folderId) return;
    const { createNote } = await import('../../lib/api/notes');
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

  return (
    <>
      <MainHeader
        segments={segments}
        noteLabel={noteLabel}
        folderId={folderId}
        onCreateFolder={handleCreateFolder}
        onCreateNote={handleCreateNote}
        onToggleNav={onToggleNav}
      />

      <PromptDialog
        open={folderPromptOpen}
        title="새 폴더"
        placeholder="폴더 이름을 입력하세요"
        onConfirm={handleFolderPromptConfirm}
        onCancel={handleFolderPromptCancel}
      />
    </>
  );
}
