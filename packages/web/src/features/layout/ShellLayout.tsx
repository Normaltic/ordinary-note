import { type ReactNode } from 'react';
import { useNavStore } from '../../stores/nav.store';
import { useCurrentFolderId } from './hooks/useCurrentFolderId';
import { useColumnIds } from './hooks/useColumnIds';
import { useStandalone } from './hooks/useStandalone';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { FolderContentColumn } from '../finder/FolderContentColumn';
import { Toast } from './components/Toast';

interface ShellLayoutProps {
  children: ReactNode;
}

export function ShellLayout({ children }: ShellLayoutProps) {
  const folderId = useCurrentFolderId();
  const { columnIds, ancestorPath } = useColumnIds(folderId);
  const { standalone } = useStandalone();

  return (
    <div className="flex h-dvh flex-col lg:bg-bg-frame lg:pb-3 lg:pr-3">
      <TopBar />
      <div className="flex min-h-0 flex-1">
      <Sidebar>
        {!standalone && columnIds.length >= 2 && (
          <FolderContentColumn
            folderId={columnIds[columnIds.length - 2]}
            activeId={columnIds[columnIds.length - 1]}
            className="w-40"
            onNavigate={useNavStore.getState().close}
          />
        )}
        {!standalone && columnIds.length >= 1 && (
          <FolderContentColumn
            folderId={columnIds[columnIds.length - 1]}
            activeId={ancestorPath[ancestorPath.length - 1]}
            className="w-40"
            onNavigate={useNavStore.getState().close}
          />
        )}
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-bg-page">
        {children}
      </div>

      <Toast />
      </div>
    </div>
  );
}
