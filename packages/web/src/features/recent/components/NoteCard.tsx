import { Link } from 'react-router-dom';
import type { RecentNote } from '../api/fetchRecentNotes';

interface NoteCardProps {
  note: RecentNote;
}

export function NoteCard({ note }: NoteCardProps) {
  const snippet = note.contentPlain?.slice(0, 200) ?? '';

  return (
    <Link
      to={`/notes/${note.id}`}
      className="block rounded-md border border-border-light bg-bg-card px-4 py-3 transition-colors hover:border-border-default hover:bg-bg-hover"
    >
      <div className="text-base font-medium text-text-primary">
        {note.title || '제목 없음'}
      </div>

      {note.folderName && (
        <div className="mt-1 text-xs text-text-muted">{note.folderName}</div>
      )}

      {snippet && (
        <div className="mt-1.5 text-sm text-text-secondary line-clamp-2">
          {snippet}
        </div>
      )}

      <div className="mt-2 text-xs text-text-muted">
        {new Date(note.updatedAt).toLocaleDateString('ko-KR')}
      </div>
    </Link>
  );
}
