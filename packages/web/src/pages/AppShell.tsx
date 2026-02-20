import { useEffect } from 'react';
import { Outlet, Link, useMatch } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useFolderStore } from '../stores/folder.store';
import { useNoteStore } from '../stores/note.store';
import { useFolderPath } from '../hooks/useFolderPath';
import { Breadcrumb } from '../components/Breadcrumb';
import { Toast } from '../components/Toast';

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const fetchTree = useFolderStore((s) => s.fetchTree);

  const folderMatch = useMatch('/folders/:folderId');
  const noteMatch = useMatch('/notes/:noteId');
  const note = useNoteStore((s) => s.note);

  const folderId =
    folderMatch?.params.folderId ?? (noteMatch ? note?.folderId : null) ?? null;

  const segments = useFolderPath(folderId);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const noteLabel = noteMatch ? (note?.title || '제목 없음') : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <Link to="/" className="text-lg font-semibold text-gray-900 hover:text-gray-700">
          Ordinary Note
        </Link>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-gray-600">{user.name}</span>
              <button
                onClick={logout}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200"
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      </header>
      {(segments.length > 0 || noteLabel) && (
        <div className="border-b border-gray-100 bg-white px-6 py-2">
          <Breadcrumb segments={segments} currentLabel={noteLabel} />
        </div>
      )}
      <main className="flex-1 bg-gray-50">
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}
