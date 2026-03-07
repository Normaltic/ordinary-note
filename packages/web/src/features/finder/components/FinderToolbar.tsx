import { HamburgerButton } from '../../../components/HamburgerButton';
import { Breadcrumb } from '../../../components/Breadcrumb';
import { PromptDialog } from '../../../components/PromptDialog';
import { useFolderPath } from '../../../hooks/queries/useFolder';
import { useFinderActions } from '../hooks/useFinderActions';

interface FinderToolbarProps {
  folderId?: string;
  showBreadcrumb?: boolean;
}

export function FinderToolbar({ folderId, showBreadcrumb }: FinderToolbarProps) {
  const segments = useFolderPath(folderId ?? null);
  const { handleCreateFolder, handleCreateNote, promptDialogProps } =
    useFinderActions(folderId);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3 lg:border-b-0">
        <div className="flex min-w-0 items-center gap-2">
          <div className="lg:hidden">
            <HamburgerButton />
          </div>
          {showBreadcrumb && (
            <div className="lg:hidden">
              <Breadcrumb segments={segments} />
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleCreateFolder}
            className="rounded-pill border border-border-default px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-hover"
          >
            + 새 폴더
          </button>
          {folderId && (
            <button
              onClick={handleCreateNote}
              className="rounded-pill bg-accent px-3 py-1.5 text-sm text-text-inverse transition-colors hover:bg-accent-hover"
            >
              + 새 노트
            </button>
          )}
        </div>
      </div>

      <PromptDialog
        open={promptDialogProps.open}
        title={promptDialogProps.title}
        placeholder="폴더 이름을 입력하세요"
        defaultValue={promptDialogProps.defaultValue}
        onConfirm={promptDialogProps.onConfirm}
        onCancel={promptDialogProps.onCancel}
      />
    </>
  );
}
