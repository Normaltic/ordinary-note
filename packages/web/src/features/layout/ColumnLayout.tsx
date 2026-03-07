import type { ReactNode } from 'react';
import { useColumnIds } from './hooks/useColumnIds';
import { FolderContentColumn } from '../finder/FolderContentColumn';

interface ColumnLayoutProps {
  folderId: string | null;
  columnWidth?: string;
  children: ReactNode;
}

export function ColumnLayout({
  folderId,
  columnWidth = 'w-40',
  children,
}: ColumnLayoutProps) {
  const { columnIds, ancestorPath } = useColumnIds(folderId);

  return (
    <div className="flex h-full">
      {columnIds.length >= 2 && (
        <div className="hidden xl:flex">
          <FolderContentColumn
            folderId={columnIds[columnIds.length - 2]}
            activeId={columnIds[columnIds.length - 1]}
            className={columnWidth}
          />
        </div>
      )}
      {columnIds.length >= 1 && (
        <div className="hidden lg:flex">
          <FolderContentColumn
            folderId={columnIds[columnIds.length - 1]}
            activeId={ancestorPath[ancestorPath.length - 1] ?? null}
            className={columnWidth}
          />
        </div>
      )}
      {children}
    </div>
  );
}
