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
    <div className="flex min-h-dvh">
      <ColumnNavContainer open={navOpen} onClose={closeNav} />

      <main className="min-w-0 flex-1 bg-bg-page">
        <MainHeaderContainer onToggleNav={toggleNav} />
        {children}
      </main>

      <Toast />
    </div>
  );
}
