import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useFolderStore } from '../../stores/folder.store';
import { ColumnNavContainer } from './ColumnNavContainer';
import { MainHeaderContainer } from './MainHeaderContainer';
import { Toast } from '../../components/Toast';

interface ShellLayoutProps {
  children: ReactNode;
}

export function ShellLayout({ children }: ShellLayoutProps) {
  const fetchTree = useFolderStore((s) => s.fetchTree);
  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const [navOpen, setNavOpen] = useState(false);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const toggleNav = useCallback(() => setNavOpen((v) => !v), []);

  return (
    <div className="flex h-dvh">
      <ColumnNavContainer open={navOpen} onClose={closeNav} />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-bg-page">
        <MainHeaderContainer onToggleNav={toggleNav} />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </main>

      <Toast />
    </div>
  );
}
