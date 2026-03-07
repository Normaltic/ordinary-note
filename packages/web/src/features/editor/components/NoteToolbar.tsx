import { HamburgerButton } from '../../../components/HamburgerButton';
import { Breadcrumb } from '../../../components/Breadcrumb';
import { useFolderPath } from '../../../hooks/queries/useFolder';
import { useStandalone } from '../../layout/hooks/useStandalone';
import SidebarIcon from '../../../components/icons/sidebar.svg?react';
import SidebarCollapseIcon from '../../../components/icons/sidebar-collapse.svg?react';

interface NoteToolbarProps {
  folderId: string | null;
  noteLabel: string;
}

export function NoteToolbar({ folderId, noteLabel }: NoteToolbarProps) {
  const segments = useFolderPath(folderId);
  const { standalone, toggleStandalone } = useStandalone();

  return (
    <div className="flex items-center border-b border-border-light px-4 py-3 lg:border-b-0">
      <div className="flex min-w-0 items-center gap-2">
        <div className="lg:hidden">
          <HamburgerButton />
        </div>
        <div className="hidden lg:block">
          <button
            onClick={toggleStandalone}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
            aria-label={standalone ? '사이드바 열기' : '사이드바 닫기'}
          >
            {standalone ? (
              <SidebarIcon className="size-[18px]" />
            ) : (
              <SidebarCollapseIcon className="size-[18px]" />
            )}
          </button>
        </div>
        <Breadcrumb segments={segments} currentLabel={noteLabel} />
      </div>
    </div>
  );
}
