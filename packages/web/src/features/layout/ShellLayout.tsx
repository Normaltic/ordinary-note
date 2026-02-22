import { useEffect, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useFolderStore } from '../../stores/folder.store';
import { ColumnNavContainer } from './ColumnNavContainer';
import { MainHeaderContainer } from './MainHeaderContainer';
import { Toast } from '../../components/Toast';

export function ShellLayout() {
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
        <Outlet />
      </main>

      <Toast />
    </div>
  );
}
