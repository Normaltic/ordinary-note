import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/axios';
import { useFolderStore } from '../../stores/folder.store';
import { SidebarFolderTree } from './SidebarFolderTree';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onCreateFolder: () => void;
  onCreateNote: () => void;
}

export function Sidebar({ open, onClose, onCreateFolder, onCreateNote }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const tree = useFolderStore((s) => s.tree);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      useAuthStore.getState().clearAuth();
    }
  };

  return (
    <>
      {/* Overlay (mobile/tablet) */}
      <div
        className={`fixed inset-0 z-[var(--z-index-sidebar-overlay)] bg-bg-overlay transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-[var(--z-index-sidebar)] flex w-[var(--sidebar-width)] flex-col border-r border-border-default bg-bg-sidebar transition-transform duration-[var(--transition-timing-sidebar)] lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center px-4 pt-4 pb-3">
          <Link
            to="/"
            onClick={onClose}
            className="font-heading text-lg font-bold tracking-tight text-text-primary"
          >
            ordinary note
          </Link>
        </div>

        {/* User */}
        {user && (
          <div className="mx-2 flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-bg-hover">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-accent-subtle text-xs font-semibold text-accent">
              {user.name.charAt(0)}
            </div>
            <span className="min-w-0 flex-1 truncate text-sm text-text-secondary">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="shrink-0 text-xs text-text-muted transition-colors hover:text-text-primary"
            >
              로그아웃
            </button>
          </div>
        )}

        {/* Folder tree */}
        <SidebarFolderTree tree={tree} onNavigate={onClose} />

        {/* Footer actions */}
        <div className="flex gap-2 border-t border-border-default p-3">
          <button
            onClick={() => { onCreateFolder(); onClose(); }}
            className="flex-1 rounded-pill border border-border-default px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-hover"
          >
            + 새 폴더
          </button>
          <button
            onClick={() => { onCreateNote(); onClose(); }}
            className="flex-1 rounded-pill bg-accent px-3 py-1.5 text-sm text-text-inverse transition-colors hover:bg-accent-hover"
          >
            + 새 노트
          </button>
        </div>
      </aside>
    </>
  );
}
