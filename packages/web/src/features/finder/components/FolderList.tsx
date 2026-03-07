import { Link } from 'react-router-dom';
import { ContextMenu } from '../../../components/ContextMenu';
import FolderDetailedIcon from '../../../assets/icons/folder-detailed.svg?react';
import type { FolderSummary } from '@ordinary-note/shared';

interface FolderListProps {
  folders: FolderSummary[];
  openMenuId: string | null;
  onMenuToggle: (id: string) => void;
  onMenuClose: () => void;
  onRename: (folder: FolderSummary) => void;
  onDelete: (folder: FolderSummary) => void;
  onCreate?: () => void;
}

export function FolderList({
  folders,
  openMenuId,
  onMenuToggle,
  onMenuClose,
  onRename,
  onDelete,
  onCreate,
}: FolderListProps) {
  if (folders.length === 0 && !onCreate) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between px-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
          폴더
        </h2>
        {onCreate && (
          <button
            onClick={onCreate}
            className="flex h-5 w-5 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
            aria-label="새 폴더"
          >
            +
          </button>
        )}
      </div>
      {folders.length === 0 && onCreate && (
        <button
          onClick={onCreate}
          className="flex w-full items-center justify-center gap-2 px-3 py-4 text-sm text-text-muted transition-colors hover:border-border-hover hover:bg-bg-hover hover:text-text-secondary"
        >
          + 새 폴더 만들기
        </button>
      )}
      <div className="space-y-1">
        {folders.map((folder) => (
          <div key={folder.id} className="group relative">
            <Link
              to={`/folders/${folder.id}`}
              className="flex items-center gap-3 rounded px-3 py-2.5 hover:bg-bg-hover"
            >
              <FolderDetailedIcon className="size-5 shrink-0 text-text-secondary" />
              <span className="flex-1 text-sm font-medium text-text-primary">
                {folder.name}
              </span>
              <span className="text-xs text-text-muted shrink-0 group-hover:hidden">
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
