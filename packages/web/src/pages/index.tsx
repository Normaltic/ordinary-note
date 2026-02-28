import { useState, useCallback } from 'react';
import { useFolderStore } from '../stores/folder.store';
import { HamburgerButton } from '../components/HamburgerButton';
import { FinderPageContent } from '../features/finder/FinderPageContent';
import { PromptDialog } from '../components/PromptDialog';

export function IndexPage() {
  const createFolder = useFolderStore((s) => s.createFolder);
  const [folderPromptOpen, setFolderPromptOpen] = useState(false);

  const handleCreateFolder = useCallback(() => {
    setFolderPromptOpen(true);
  }, []);

  const handleFolderPromptConfirm = useCallback(
    async (name: string) => {
      setFolderPromptOpen(false);
      await createFolder(name);
    },
    [createFolder],
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
