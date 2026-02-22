import { EditorView } from '../../features/editor/EditorView';

export function NotePage() {
  return (
    <div className="mx-auto w-full max-w-[var(--max-editor-width)] px-6 py-6">
      <EditorView />
    </div>
  );
}
