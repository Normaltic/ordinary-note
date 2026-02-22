import { Outlet } from 'react-router-dom';
import { useAppShell } from './hooks/useAppShell';
import { ColumnNav } from './components/ColumnNav';
import { MainHeader } from './components/MainHeader';
import { Toast } from '../../components/Toast';
import { PromptDialog } from '../../components/PromptDialog';

export function ShellLayout() {
  const {
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
  } = useAppShell();

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
        onConfirm={handleFolderPromptConfirm}
        onCancel={handleFolderPromptCancel}
      />
    </div>
  );
}
