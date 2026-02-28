import { useNoteStore } from '../../stores/note.store';
import { FinderView } from '../../features/finder/FinderView';
import { EditorView } from '../../features/editor/EditorView';

export function NotePage() {
  const folderId = useNoteStore((s) => s.note?.folderId ?? null);

  return (
    <div className="flex h-full">
      {folderId && (
        <div className="hidden w-80 shrink-0 overflow-y-auto border-r border-border-default px-6 py-6 lg:block">
          <FinderView folderId={folderId} />
        </div>
      )}
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[var(--max-editor-width)] px-6 py-6">
          <EditorView />
        </div>
      </div>
    </div>
  );
}
