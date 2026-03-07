import type { ReactNode } from 'react';
import { useColumnIds } from '../hooks/useColumnIds';
import { AncestorColumns } from './AncestorColumns';

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
      <AncestorColumns
        columnIds={columnIds}
        activeId={ancestorPath[ancestorPath.length - 1] ?? null}
        columnWidth={columnWidth}
      />
      {children}
    </div>
  );
}
