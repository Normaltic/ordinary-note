import { useEffect, useState, useCallback } from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import { useFolderStore } from '../stores/folder.store';
import { useNoteStore } from '../stores/note.store';
import { useFolderPath } from '../hooks/useFolderPath';
import { Breadcrumb } from '../components/Breadcrumb';
import { Sidebar } from '../components/layout/Sidebar';
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
  const noteLabel = noteMatch ? (note?.title || '제목 없음') : undefined;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [folderPromptOpen, setFolderPromptOpen] = useState(false);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

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
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        onCreateFolder={handleCreateFolder}
        onCreateNote={handleCreateNote}
      />

      {/* Main area */}
      <main className="min-w-0 flex-1 bg-bg-page lg:ml-[var(--sidebar-width)]">
        {/* Page header */}
        <div className="flex items-center justify-between border-b border-border-light px-6 py-5">
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile/tablet) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-hover lg:hidden"
              aria-label="사이드바 열기"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        {(segments.length > 0 || noteLabel) && (
          <div className="border-b border-border-light px-6 py-2">
            <Breadcrumb segments={segments} currentLabel={noteLabel} />
          </div>
        )}

        {/* Content */}
        <Outlet />
      </main>

      <Toast />

      {/* Folder creation prompt */}
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
