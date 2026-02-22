import { useEffect, useState, useCallback } from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import { useFolderStore } from '../stores/folder.store';
import { useNoteStore } from '../stores/note.store';
import { useFolderPath } from '../hooks/useFolderPath';
import { useAncestorColumns } from '../hooks/useAncestorColumns';
import { ColumnNav } from '../components/layout/ColumnNav';
import { MainHeader } from '../components/layout/MainHeader';
import { Toast } from '../components/Toast';
import { PromptDialog } from '../components/PromptDialog';

export function AppShell() {
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
    const { createNote } = await import('../lib/api/notes');
    const newNote = await createNote({ folderId });
    navigate(`/notes/${newNote.id}`);
  }, [folderId, navigate]);

  return (
    <div className="flex min-h-dvh">
      <ColumnNav open={navOpen} onClose={closeNav} columns={columns} />

      <main className="min-w-0 flex-1 bg-bg-page">
        <MainHeader
          segments={segments}
          noteLabel={noteLabel}
          folderId={folderId}
          onCreateFolder={handleCreateFolder}
          onCreateNote={handleCreateNote}
          onToggleNav={toggleNav}
        />

        <Outlet />
      </main>

      <Toast />

      <PromptDialog
        open={folderPromptOpen}
        title="새 폴더"
        placeholder="폴더 이름을 입력하세요"
        onConfirm={async (name) => {
          setFolderPromptOpen(false);
          await createFolder(name, folderId ?? undefined);
        }}
        onCancel={() => setFolderPromptOpen(false)}
      />
    </div>
  );
}
