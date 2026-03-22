import { useState, useCallback } from 'react';
import { PromptDialog } from '../../components/PromptDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useFolderChildren, useFolderPath } from '../../hooks/queries/useFolder';
import { useFinderActions } from './hooks/useFinderActions';
import { FolderList } from './components/FolderList';
import { NoteList } from './components/NoteList';

interface FinderViewProps {
  folderId?: string | null;
}

export function FinderView({ folderId: propFolderId }: FinderViewProps = {}) {
  const folderId = propFolderId ?? null;
  const { folders, notes, isLoading } = useFolderChildren(folderId);
  const segments = useFolderPath(folderId);
  const title = segments[segments.length - 1]?.name ?? '홈';
  const {
    handleCreateFolder,
    handleCreateNote,
    handleRenameFolder,
    handleDeleteFolder,
    handleTogglePin,
    handleDeleteNote,
    promptDialogProps,
    confirmDialogProps,
  } = useFinderActions(folderId ?? undefined);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const toggleMenu = useCallback(
    (id: string) => setOpenMenuId((prev) => (prev === id ? null : id)),
    [],
  );
  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-text-muted">로딩 중...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10 px-3 text-base text-text-primary truncate">
        {title}
      </div>

      <FolderList
        folders={folders}
        openMenuId={openMenuId}
        onMenuToggle={toggleMenu}
        onMenuClose={closeMenu}
        onRename={(f) => {
          closeMenu();
          handleRenameFolder(f);
        }}
        onDelete={(f) => {
          closeMenu();
          handleDeleteFolder(f);
        }}
        onCreate={handleCreateFolder}
      />

      <NoteList
        notes={notes}
        openMenuId={openMenuId}
        onMenuToggle={toggleMenu}
        onMenuClose={closeMenu}
        onTogglePin={(n) => {
          closeMenu();
          handleTogglePin(n);
        }}
        onDelete={(n) => {
          closeMenu();
          handleDeleteNote(n);
        }}
        onCreate={folderId ? handleCreateNote : undefined}
      />

      <PromptDialog
        open={promptDialogProps.open}
        title={promptDialogProps.title}
        placeholder="이름을 입력하세요"
        defaultValue={promptDialogProps.defaultValue}
        onConfirm={promptDialogProps.onConfirm}
        onCancel={promptDialogProps.onCancel}
      />
      <ConfirmDialog
        open={confirmDialogProps.open}
        title={confirmDialogProps.title}
        message={confirmDialogProps.message}
        onConfirm={confirmDialogProps.onConfirm}
        onCancel={confirmDialogProps.onCancel}
      />
    </div>
  );
}
