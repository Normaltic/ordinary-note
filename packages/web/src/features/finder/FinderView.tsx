import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PromptDialog } from '../../components/PromptDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useFolderChildren } from '../../hooks/queries/useFolder';
import { useFinderActions } from './hooks/useFinderActions';
import { FolderList } from './components/FolderList';
import { NoteList } from './components/NoteList';

export function FinderView({
  folderId: propFolderId,
}: { folderId?: string } = {}) {
  const { folderId: paramFolderId } = useParams<{ folderId: string }>();
  const folderId = propFolderId ?? paramFolderId ?? null;
  const { folders, notes, isLoading } = useFolderChildren(folderId);
  const {
    handleRenameFolder,
    handleDeleteFolder,
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

  const isEmpty = folders.length === 0 && notes.length === 0;

  return (
    <>
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
      />

      <NoteList
        notes={notes}
        openMenuId={openMenuId}
        onMenuToggle={toggleMenu}
        onMenuClose={closeMenu}
        onDelete={(n) => {
          closeMenu();
          handleDeleteNote(n);
        }}
      />

      {isEmpty && (
        <div className="py-20 text-center text-text-muted">
          이 폴더는 비어 있습니다
        </div>
      )}

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
    </>
  );
}
