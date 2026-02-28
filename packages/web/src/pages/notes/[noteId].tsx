import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useNoteStore } from '../../stores/note.store';
import { useFolderStore, selectAncestorPath } from '../../stores/folder.store';
import { FolderContentColumn } from '../../features/layout/components/FolderContentColumn';
import { MainHeaderContainer } from '../../features/layout/MainHeaderContainer';
import { FinderView } from '../../features/finder/FinderView';
import { EditorView } from '../../features/editor/EditorView';

export function NotePage() {
  const folderId = useNoteStore((s) => s.note?.folderId ?? null);
  const ancestorPath = useFolderStore(useShallow(selectAncestorPath(folderId)));
  const columnIds = ancestorPath.length > 1 ? ancestorPath.slice(0, -1) : [];
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

      {/* Content area (header + editor) */}
      <div className="flex min-w-0 flex-1 flex-col">
        {!standalone && <MainHeaderContainer />}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[var(--max-editor-width)] px-6 py-6">
            <div className={`mb-2${standalone ? '' : ' hidden lg:block'}`}>
              <button
                onClick={toggleStandalone}
                className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
                aria-label={standalone ? '사이드바 열기' : '사이드바 닫기'}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {standalone ? (
                    <>
                      <rect x="2" y="2" width="14" height="14" rx="2" />
                      <line x1="7" y1="2" x2="7" y2="16" />
                    </>
                  ) : (
                    <>
                      <rect x="2" y="2" width="14" height="14" rx="2" />
                      <line x1="7" y1="2" x2="7" y2="16" />
                      <line x1="7" y1="9" x2="2" y2="5" />
                      <line x1="7" y1="9" x2="2" y2="13" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            <EditorView />
          </div>
        </div>
      </div>
    </div>
  );
}
