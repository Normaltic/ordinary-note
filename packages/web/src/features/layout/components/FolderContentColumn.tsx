import { useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useFolderContents } from '../../finder/hooks/useFolderContents';

interface FolderContentColumnProps {
  folderId: string;
  activeId: string | null;
  onNavigate?: () => void;
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M3 4h4l2 2h8v10H3V4z" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M6 2h5l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <polyline points="11 2 11 7 16 7" />
    </svg>
  );
}

export function FolderContentColumn({ folderId, activeId, onNavigate }: FolderContentColumnProps) {
  const { folders, notes } = useFolderContents(folderId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentNoteId = searchParams.get('note');

  const handleNoteClick = useCallback((e: React.MouseEvent, noteId: string) => {
    if (window.matchMedia('(min-width: 1280px)').matches) {
      e.preventDefault();
      if (currentNoteId === noteId) {
        navigate(`/folders/${folderId}`);
      } else {
        navigate(`/folders/${folderId}?note=${noteId}`);
      }
    }
    onNavigate?.();
  }, [navigate, folderId, onNavigate, currentNoteId]);

  return (
    <div className="flex w-40 shrink-0 flex-col border-r border-border-default bg-bg-sidebar">
      <nav className="flex-1 overflow-y-auto">
        {folders.map((folder) => {
          const isActive = folder.id === activeId;
          return (
            <Link
              key={folder.id}
              to={`/folders/${folder.id}`}
              onClick={onNavigate}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors select-none ${
                isActive
                  ? 'bg-accent-subtle text-accent font-medium'
                  : 'text-text-primary hover:bg-bg-hover'
              }`}
            >
              <FolderIcon />
              <span className="min-w-0 flex-1 truncate">{folder.name}</span>
              {folder.noteCount > 0 && (
                <span className="shrink-0 text-xs text-text-muted">{folder.noteCount}</span>
              )}
            </Link>
          );
        })}
        {notes.map((note) => {
          const isActive = note.id === activeId;
          return (
            <Link
              key={note.id}
              to={`/notes/${note.id}`}
              onClick={(e) => handleNoteClick(e, note.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors select-none ${
                isActive
                  ? 'bg-accent-subtle text-accent font-medium'
                  : 'text-text-primary hover:bg-bg-hover'
              }`}
            >
              <NoteIcon />
              <span className="min-w-0 flex-1 truncate">{note.title || '제목 없음'}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
