import { Link } from 'react-router-dom';
import { useFolderChildren } from '../../hooks/queries/useFolder';
import { usePrefetchNote } from '../../hooks/queries/useNote';
import FolderIcon from '../../assets/icons/folder.svg?react';
import FileIcon from '../../assets/icons/file.svg?react';

interface FolderContentColumnProps {
  folderId: string;
  activeId: string | null;
  onNavigate?: () => void;
  className?: string;
}

export function FolderContentColumn({
  folderId,
  activeId,
  onNavigate,
  className,
}: FolderContentColumnProps) {
  const { folders, notes } = useFolderChildren(folderId);
  const prefetchNote = usePrefetchNote();

  return (
    <div
      className={`flex shrink-0 flex-col border-r border-border-default bg-bg-sidebar ${className ?? 'w-40'}`}
    >
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
              <FolderIcon className="size-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{folder.name}</span>
              {folder.noteCount > 0 && (
                <span className="shrink-0 text-xs text-text-muted">
                  {folder.noteCount}
                </span>
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
              onMouseEnter={() => prefetchNote(note.id)}
              onClick={onNavigate}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors select-none ${
                isActive
                  ? 'bg-accent-subtle text-accent font-medium'
                  : 'text-text-primary hover:bg-bg-hover'
              }`}
            >
              <FileIcon className="size-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                {note.title || '제목 없음'}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
