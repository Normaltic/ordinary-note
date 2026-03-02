import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAncestorPath } from '../../hooks/queries/useFolderTree';
import { useCreateFolder } from '../../hooks/queries/useFolderMutations';
import { useCreateNote } from '../../hooks/queries/useNote';
import { FolderContentColumn } from '../../features/layout/components/FolderContentColumn';
import { HamburgerButton } from '../../components/HamburgerButton';
import { Breadcrumb } from '../../components/Breadcrumb';
import { useFolderPath } from '../../features/layout/hooks/useFolderPath';
import { FinderPageContent } from '../../features/finder/FinderPageContent';
import { PromptDialog } from '../../components/PromptDialog';
import { useToastStore } from '../../stores/toast.store';

export function FolderPage() {
  const { folderId } = useParams();
  const { data: ancestorPath = [] } = useAncestorPath(folderId ?? null);
  const columnIds = ancestorPath.length > 1 ? ancestorPath.slice(0, -1) : [];
  const segments = useFolderPath(folderId ?? null);
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [folderPromptOpen, setFolderPromptOpen] = useState(false);

  const createFolder = useCreateFolder();
  const createNote = useCreateNote();

  const handleCreateFolder = useCallback(() => {
    setFolderPromptOpen(true);
  }, []);

  const handleCreateNote = useCallback(() => {
    if (!folderId) return;
    createNote.mutate(
      { folderId },
      {
        onSuccess: (note) => navigate(`/notes/${note.id}`),
        onError: () => addToast('error', '노트 생성에 실패했습니다'),
      },
    );
  }, [folderId, createNote, navigate, addToast]);

  const handleFolderPromptConfirm = useCallback(
    (name: string) => {
      setFolderPromptOpen(false);
      createFolder.mutate(
        { name, parentId: folderId },
        {
          onSuccess: () => addToast('success', '폴더가 생성되었습니다'),
          onError: () => addToast('error', '폴더 생성에 실패했습니다'),
        },
      );
    },
    [createFolder, folderId, addToast],
  );

  const handleFolderPromptCancel = useCallback(() => {
    setFolderPromptOpen(false);
  }, []);

  return (
    <div className="flex h-full">
      {/* Desktop columns */}
      {columnIds.length >= 2 && (
        <div className="hidden xl:flex">
          <FolderContentColumn
            folderId={columnIds[columnIds.length - 2]}
            activeId={columnIds[columnIds.length - 1]}
            className="w-80"
          />
        </div>
      )}
      {columnIds.length >= 1 && (
        <div className="hidden lg:flex">
          <FolderContentColumn
            folderId={columnIds[columnIds.length - 1]}
            activeId={ancestorPath[ancestorPath.length - 1]}
            className="w-80"
          />
        </div>
      )}

      {/* Content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-border-light px-4 py-3 lg:border-b-0">
          <div className="flex min-w-0 items-center gap-2">
            <div className="lg:hidden">
              <HamburgerButton />
            </div>
            <div className="lg:hidden">
              <Breadcrumb segments={segments} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleCreateFolder}
              className="rounded-pill border border-border-default px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-hover"
            >
              + 새 폴더
            </button>
            <button
              onClick={handleCreateNote}
              className="rounded-pill bg-accent px-3 py-1.5 text-sm text-text-inverse transition-colors hover:bg-accent-hover"
            >
              + 새 노트
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <FinderPageContent />
        </div>
      </div>

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
