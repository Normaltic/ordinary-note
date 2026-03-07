import { useParams } from 'react-router-dom';
import { useNoteQuery } from '../../hooks/queries/useNote';
import { useFolderPath } from '../../hooks/queries/useFolder';
import { useStandalone } from '../../features/layout/hooks/useStandalone';
import { ColumnLayout } from '../../features/layout/components/ColumnLayout';
import { NoteSidebar } from '../../features/finder/components/NoteSidebar';
import { HamburgerButton } from '../../components/HamburgerButton';
import { Breadcrumb } from '../../components/Breadcrumb';
import { EditorView } from '../../features/editor/EditorView';
import SidebarIcon from '../../components/icons/sidebar.svg?react';
import SidebarCollapseIcon from '../../components/icons/sidebar-collapse.svg?react';

export function NotePage() {
  const { noteId } = useParams<{ noteId: string }>();
  const { data: note } = useNoteQuery(noteId ?? null);
  const folderId = note?.folderId ?? null;
  const { standalone, toggleStandalone } = useStandalone();
  const segments = useFolderPath(folderId);
  const noteLabel = note?.title || '제목 없음';

  return (
    <ColumnLayout folderId={standalone ? null : folderId} columnWidth="w-40">
      {!standalone && folderId && <NoteSidebar folderId={folderId} />}
      <div className="flex min-w-0 flex-1 flex-col">
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
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[var(--max-editor-width)] px-6 py-6">
            <EditorView />
          </div>
        </div>
      </div>
    </ColumnLayout>
  );
}
