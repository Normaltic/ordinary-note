import { useState, useCallback } from 'react';
import { useCreateFolder } from '../hooks/queries/useFolder';
import { HamburgerButton } from '../components/HamburgerButton';
import { FinderPageContent } from '../features/finder/FinderPageContent';
import { PromptDialog } from '../components/PromptDialog';
import { useToastStore } from '../stores/toast.store';

export function IndexPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [folderPromptOpen, setFolderPromptOpen] = useState(false);

  const createFolder = useCreateFolder();

  const handleCreateFolder = useCallback(() => {
    setFolderPromptOpen(true);
  }, []);

  const handleFolderPromptConfirm = useCallback(
    (name: string) => {
      setFolderPromptOpen(false);
      createFolder.mutate(
        { name },
        {
          onSuccess: () => addToast('success', '폴더가 생성되었습니다'),
          onError: () => addToast('error', '폴더 생성에 실패했습니다'),
        },
      );
    },
    [createFolder, addToast],
  );

  const handleFolderPromptCancel = useCallback(() => {
    setFolderPromptOpen(false);
  }, []);

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="lg:hidden">
          <HamburgerButton />
        </div>
        <div className="ml-auto flex shrink-0 items-center">
          <button
            onClick={handleCreateFolder}
            className="rounded-pill border border-border-default px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-hover"
          >
            + 새 폴더
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <FinderPageContent />
      </div>

      <PromptDialog
        open={folderPromptOpen}
        title="새 폴더"
        placeholder="폴더 이름을 입력하세요"
        onConfirm={handleFolderPromptConfirm}
        onCancel={handleFolderPromptCancel}
      />
    </>
  );
}
