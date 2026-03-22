import { usePinnedNotes } from './hooks/usePinnedNotes';
import { NoteCard } from '../recent/components/NoteCard';

interface PinnedNotesProps {
  limit?: number;
}

export function PinnedNotes({ limit = 20 }: PinnedNotesProps) {
  const { data: notes = [], isLoading } = usePinnedNotes(limit);

  return (
    <>
      <h1 className="text-lg font-semibold text-text-primary">핀 노트</h1>

      {isLoading && (
        <p className="mt-4 text-sm text-text-muted">불러오는 중...</p>
      )}

      {!isLoading && notes.length === 0 && (
        <p className="mt-4 text-sm text-text-muted">
          핀한 노트가 없습니다
        </p>
      )}

      {!isLoading && notes.length > 0 && (
        <>
          <p className="mt-1 text-sm text-text-muted">
            {notes.length}개의 노트
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
