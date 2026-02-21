import { Link } from 'react-router-dom';
import { ContextMenu } from '../../components/ContextMenu';
import { formatDate } from '../../utils/format';
import type { NoteSummary } from '@ordinary-note/shared';

interface NoteListProps {
  notes: NoteSummary[];
  openMenuId: string | null;
  onMenuToggle: (id: string) => void;
  onMenuClose: () => void;
  onDelete: (note: NoteSummary) => void;
}

export function NoteList({
  notes,
  openMenuId,
  onMenuToggle,
  onMenuClose,
  onDelete,
}: NoteListProps) {
  if (notes.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        노트
      </h2>
      <div className="space-y-1">
        {notes.map((note) => (
          <div key={note.id} className="group relative">
            <Link
              to={`/notes/${note.id}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-bg-hover"
            >
              <span className="text-lg">📝</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {note.title || '제목 없음'}
                </div>
                {note.contentPreview && (
                  <div className="text-xs text-text-muted truncate">
                    {note.contentPreview}
                  </div>
                )}
              </div>
              <span className="text-xs text-text-muted shrink-0">
                {formatDate(note.updatedAt)}
              </span>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMenuToggle(note.id);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted opacity-0 hover:bg-bg-active hover:text-text-secondary group-hover:opacity-100"
            >
              ⋯
            </button>
            <ContextMenu open={openMenuId === note.id} onClose={onMenuClose}>
              <button
                onClick={() => onDelete(note)}
                className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-bg-hover"
              >
                삭제
              </button>
            </ContextMenu>
          </div>
        ))}
      </div>
    </section>
  );
}
