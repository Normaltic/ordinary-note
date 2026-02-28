import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useNoteStore } from '../../stores/note.store';
import { useFolderStore, selectAncestorPath } from '../../stores/folder.store';
import { FolderContentColumn } from '../../features/layout/components/FolderContentColumn';
import { HamburgerButton } from '../../components/HamburgerButton';
import { Breadcrumb } from '../../components/Breadcrumb';
import { useFolderPath } from '../../features/layout/hooks/useFolderPath';
import { FinderView } from '../../features/finder/FinderView';
import { EditorView } from '../../features/editor/EditorView';
import SidebarIcon from '../../components/icons/sidebar.svg?react';
import SidebarCollapseIcon from '../../components/icons/sidebar-collapse.svg?react';

export function NotePage() {
  const folderId = useNoteStore((s) => s.note?.folderId ?? null);
  const note = useNoteStore((s) => s.note);
  const ancestorPath = useFolderStore(useShallow(selectAncestorPath(folderId)));
  const columnIds = ancestorPath.length > 1 ? ancestorPath.slice(0, -1) : [];
  const segments = useFolderPath(folderId);
  const noteLabel = note?.title || '제목 없음';

  const [searchParams, setSearchParams] = useSearchParams();
  const standalone = searchParams.has('standalone');

  const toggleStandalone = useCallback(() => {
    setSearchParams((prev) => {
      if (prev.has('standalone')) {
        prev.delete('standalone');
      } else {
        prev.set('standalone', 'true');
      }
      return prev;
    });
  }, [setSearchParams]);

  return (
    <div className="flex h-full">
      {!standalone && (
        <>
          {columnIds.length >= 2 && (
            <div className="hidden xl:flex">
              <FolderContentColumn
                folderId={columnIds[columnIds.length - 2]}
                activeId={columnIds[columnIds.length - 1]}
                className="w-40"
              />
            </div>
          )}
          {columnIds.length >= 1 && (
            <div className="hidden lg:flex">
              <FolderContentColumn
                folderId={columnIds[columnIds.length - 1]}
                activeId={ancestorPath[ancestorPath.length - 1]}
                className="w-40"
              />
            </div>
          )}
          {folderId && (
            <div className="hidden w-80 shrink-0 overflow-y-auto border-r border-border-default px-6 py-6 lg:block">
              <FinderView folderId={folderId} />
            </div>
          )}
        </>
      )}

      {/* Content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
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
    </div>
  );
}
