import { useRecentNotes } from './hooks/useRecentNotes';
import { NoteCard } from './components/NoteCard';

interface RecentNotesProps {
  limit?: number;
}

export function RecentNotes({ limit = 20 }: RecentNotesProps) {
  const { data: notes = [], isLoading } = useRecentNotes(limit);

  if (isLoading) {
    return <p className="text-sm text-text-muted">불러오는 중...</p>;
  }

  if (notes.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
