import { Link } from 'react-router-dom';
import { ContextMenu } from '../../../components/ContextMenu';
import type { FolderSummary } from '@ordinary-note/shared';

interface FolderListProps {
  folders: FolderSummary[];
  openMenuId: string | null;
  onMenuToggle: (id: string) => void;
  onMenuClose: () => void;
  onRename: (folder: FolderSummary) => void;
  onDelete: (folder: FolderSummary) => void;
}

export function FolderList({
  folders,
  openMenuId,
  onMenuToggle,
  onMenuClose,
  onRename,
  onDelete,
}: FolderListProps) {
  if (folders.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        폴더
      </h2>
      <div className="space-y-1">
        {folders.map((folder) => (
          <div key={folder.id} className="group relative">
            <Link
              to={`/folders/${folder.id}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-bg-hover"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-secondary">
                <path d="M2 5.5C2 4.4 2.9 3.5 4 3.5h3.6c.5 0 1 .2 1.4.5l1 1c.4.3.9.5 1.4.5H16c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V5.5z" />
              </svg>
              <span className="flex-1 text-sm font-medium text-text-primary">
                {folder.name}
              </span>
              <span className="text-xs text-text-muted">
                {folder.childCount > 0 && `${folder.childCount}개 폴더`}
                {folder.childCount > 0 && folder.noteCount > 0 && ', '}
                {folder.noteCount > 0 && `${folder.noteCount}개 노트`}
              </span>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMenuToggle(folder.id);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted opacity-0 hover:bg-bg-active hover:text-text-secondary group-hover:opacity-100"
            >
              ⋯
            </button>
            <ContextMenu open={openMenuId === folder.id} onClose={onMenuClose}>
              <button
                onClick={() => onRename(folder)}
                className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-bg-hover"
              >
                이름 변경
              </button>
              <button
                onClick={() => onDelete(folder)}
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
