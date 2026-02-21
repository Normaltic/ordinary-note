import { useState, useCallback } from 'react';
import { PromptDialog } from '../../components/PromptDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useFinderContents } from './hooks/useFinderContents';
import { useFinderActions } from './hooks/useFinderActions';
import { FolderList } from './FolderList';
import { NoteList } from './NoteList';
import { FinderActions } from './FinderActions';

export function FinderPage() {
  const { folderId, folders, notes, isLoading } = useFinderContents();
  const {
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleCreateNote,
    handleDeleteNote,
    promptDialogProps,
    confirmDialogProps,
  } = useFinderActions(folderId);

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

  const isEmpty = folders.length === 0 && notes.length === 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <FolderList
        folders={folders}
        openMenuId={openMenuId}
        onMenuToggle={toggleMenu}
        onMenuClose={closeMenu}
        onRename={(f) => { closeMenu(); handleRenameFolder(f); }}
        onDelete={(f) => { closeMenu(); handleDeleteFolder(f); }}
      />

      <NoteList
        notes={notes}
        openMenuId={openMenuId}
        onMenuToggle={toggleMenu}
        onMenuClose={closeMenu}
        onDelete={(n) => { closeMenu(); handleDeleteNote(n); }}
      />

      {isEmpty && (
        <div className="py-20 text-center text-text-muted">
          이 폴더는 비어 있습니다
        </div>
      )}

      <FinderActions
        folderId={folderId}
        onCreateFolder={handleCreateFolder}
        onCreateNote={handleCreateNote}
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
