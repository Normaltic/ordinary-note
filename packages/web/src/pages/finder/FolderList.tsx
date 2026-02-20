import { Link } from 'react-router-dom';
import { ContextMenu } from '../../components/ContextMenu';
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
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        폴더
      </h2>
      <div className="space-y-1">
        {folders.map((folder) => (
          <div key={folder.id} className="group relative">
            <Link
              to={`/folders/${folder.id}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-100"
            >
              <span className="text-lg">📁</span>
              <span className="flex-1 text-sm font-medium text-gray-900">
                {folder.name}
              </span>
              <span className="text-xs text-gray-400">
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
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 opacity-0 hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100"
            >
              ⋯
            </button>
            <ContextMenu open={openMenuId === folder.id} onClose={onMenuClose}>
              <button
                onClick={() => onRename(folder)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                이름 변경
              </button>
              <button
                onClick={() => onDelete(folder)}
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
