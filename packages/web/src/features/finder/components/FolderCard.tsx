import { Link } from 'react-router-dom';
import FolderDetailedIcon from '../../../assets/icons/folder-detailed.svg?react';
import type { FolderSummary } from '@ordinary-note/shared';

interface FolderCardProps {
  folder: FolderSummary;
}

export function FolderCard({ folder }: FolderCardProps) {
  const meta = [
    folder.childCount > 0 && `${folder.childCount}개 폴더`,
    folder.noteCount > 0 && `${folder.noteCount}개 노트`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      to={`/folders/${folder.id}`}
      className="block rounded-md border border-border-light bg-bg-card px-4 py-3 transition-colors hover:border-border-default hover:bg-bg-hover"
    >
      <div className="flex items-center gap-2">
        <FolderDetailedIcon className="size-5 shrink-0 text-text-secondary" />
        <span className="text-base font-medium text-text-primary truncate">
          {folder.name}
        </span>
      </div>
      {meta && (
        <div className="mt-1 text-xs text-text-muted">{meta}</div>
      )}
    </Link>
  );
}
