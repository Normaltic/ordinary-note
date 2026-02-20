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
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        노트
      </h2>
      <div className="space-y-1">
        {notes.map((note) => (
          <div key={note.id} className="group relative">
            <Link
              to={`/notes/${note.id}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-100"
            >
              <span className="text-lg">📝</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {note.title || '제목 없음'}
                </div>
                {note.contentPreview && (
                  <div className="text-xs text-gray-400 truncate">
                    {note.contentPreview}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {formatDate(note.updatedAt)}
              </span>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMenuToggle(note.id);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 opacity-0 hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100"
            >
              ⋯
            </button>
            <ContextMenu open={openMenuId === note.id} onClose={onMenuClose}>
              <button
                onClick={() => onDelete(note)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
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
