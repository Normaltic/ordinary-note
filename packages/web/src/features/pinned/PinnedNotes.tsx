import { usePinnedNotes } from './hooks/usePinnedNotes';
import { NoteCard } from '../recent/components/NoteCard';

interface PinnedNotesProps {
  limit?: number;
}

export function PinnedNotes({ limit = 20 }: PinnedNotesProps) {
  const { data: notes = [], isLoading } = usePinnedNotes(limit);

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
