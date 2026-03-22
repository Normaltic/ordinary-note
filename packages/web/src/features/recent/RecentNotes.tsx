import { useRecentNotes } from './hooks/useRecentNotes';
import { NoteCard } from './components/NoteCard';

interface RecentNotesProps {
  limit?: number;
}

export function RecentNotes({ limit = 20 }: RecentNotesProps) {
  const { data: notes = [], isLoading } = useRecentNotes(limit);

  return (
    <>
      <h1 className="text-lg font-semibold text-text-primary">최근 노트</h1>

      {isLoading && (
        <p className="mt-4 text-sm text-text-muted">불러오는 중...</p>
      )}

      {!isLoading && notes.length === 0 && (
        <p className="mt-4 text-sm text-text-muted">
          최근 편집한 노트가 없습니다
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
