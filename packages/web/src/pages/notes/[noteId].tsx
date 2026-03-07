import { useParams } from 'react-router-dom';
import { useNoteQuery } from '../../hooks/queries/useNote';
import { useStandalone } from '../../features/layout/hooks/useStandalone';
import { ColumnLayout } from '../../features/layout/components/ColumnLayout';
import { NoteSidebar } from '../../features/finder/components/NoteSidebar';
import { NoteToolbar } from '../../features/editor/components/NoteToolbar';
import { EditorView } from '../../features/editor/EditorView';

export function NotePage() {
  const { noteId } = useParams<{ noteId: string }>();
  const { data: note } = useNoteQuery(noteId ?? null);
  const folderId = note?.folderId ?? null;
  const { standalone } = useStandalone();

  return (
    <ColumnLayout folderId={standalone ? null : folderId} columnWidth="w-40">
      {!standalone && folderId && <NoteSidebar folderId={folderId} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <NoteToolbar
          folderId={folderId}
          noteLabel={note?.title || '제목 없음'}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[var(--max-editor-width)] px-6 py-6">
            <EditorView />
          </div>
        </div>
      </div>
    </ColumnLayout>
  );
}
