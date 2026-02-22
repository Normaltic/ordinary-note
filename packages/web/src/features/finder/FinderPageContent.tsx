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
    }, { replace: true });
  }, [setSearchParams]);

  const handleNoteClick = useCallback((e: React.MouseEvent, noteId: string) => {
    if (window.matchMedia('(min-width: 1280px)').matches) {
      e.preventDefault();
      setSearchParams({ note: noteId }, { replace: true });
    }
  }, [setSearchParams]);

  return (
    <div className={inlineNoteId ? 'flex' : 'mx-auto w-full max-w-[var(--max-content-width)] px-6 py-6'}>
      <div className={inlineNoteId ? 'flex-1 px-6 py-6' : undefined}>
        <FinderView onNoteClick={handleNoteClick} activeNoteId={inlineNoteId} />
      </div>
      {inlineNoteId && (
        <InlineEditorPanel
          key={inlineNoteId}
          noteId={inlineNoteId}
          onClose={closeEditor}
        />
      )}
    </div>
  );
}
