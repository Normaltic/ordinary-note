import { useParams } from 'react-router-dom';
import { useNoteQuery } from '../../hooks/queries/useNote';
import { useFolderPath } from '../../hooks/queries/useFolder';
import { useStandalone } from '../../features/layout/hooks/useStandalone';
import { ColumnLayout } from '../../features/layout/ColumnLayout';
import { StandaloneToggle } from '../../features/layout/StandaloneToggle';
import { FinderView } from '../../features/finder/FinderView';
import { SidebarToggle } from '../../features/layout/SidebarToggle';
import { Breadcrumb } from '../../components/Breadcrumb';
import { EditorView } from '../../features/editor/EditorView';

export function NotePage() {
  const { noteId } = useParams<{ noteId: string }>();
  const { data: note } = useNoteQuery(noteId ?? null);
  const folderId = note?.folderId ?? null;
  const { standalone } = useStandalone();
  const segments = useFolderPath(folderId);
  const noteLabel = note?.title || '제목 없음';

  return (
    <ColumnLayout folderId={standalone ? null : folderId} columnWidth="w-40">
      {!standalone && folderId && (
        <div className="hidden w-80 shrink-0 overflow-y-auto border-r border-border-default px-6 py-6 lg:block">
          <FinderView folderId={folderId} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center border-b border-border-light px-4 py-3 lg:border-b-0">
          <div className="flex min-w-0 items-center gap-2">
            <div className="lg:hidden">
              <SidebarToggle />
            </div>
            <div className="hidden lg:block">
              <StandaloneToggle />
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
