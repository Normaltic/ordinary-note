import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FinderView } from './FinderView';
import { InlineEditorPanel } from '../editor/InlineEditorPanel';

export function FinderPageContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const inlineNoteId = searchParams.get('note');

  const closeEditor = useCallback(() => {
    setSearchParams((prev) => {
      prev.delete('note');
      return prev;
    });
  }, [setSearchParams]);

  const handleNoteClick = useCallback((e: React.MouseEvent, noteId: string) => {
    if (window.matchMedia('(min-width: 1280px)').matches) {
      e.preventDefault();
      if (inlineNoteId === noteId) {
        closeEditor();
      } else {
        setSearchParams({ note: noteId });
      }
    }
  }, [setSearchParams, inlineNoteId, closeEditor]);

  return (
    <div className={inlineNoteId ? 'flex h-full' : 'mx-auto w-full max-w-[var(--max-content-width)] px-6 py-6'}>
      <div className={inlineNoteId ? 'w-[35rem] shrink-0 overflow-y-auto px-6 py-6' : undefined}>
        <FinderView onNoteClick={handleNoteClick} activeNoteId={inlineNoteId} />
      </div>
      {inlineNoteId && (
        <div className="hidden min-w-0 flex-1 overflow-y-auto border-l border-border-default xl:block">
          <InlineEditorPanel
            key={inlineNoteId}
            noteId={inlineNoteId}
            onClose={closeEditor}
          />
        </div>
      )}
    </div>
  );
}
