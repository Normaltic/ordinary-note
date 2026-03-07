import { FolderContentColumn } from '../../finder/components/FolderContentColumn';

interface AncestorColumnsProps {
  columnIds: string[];
  activeId: string | null;
  columnWidth?: string;
}

export function AncestorColumns({
  columnIds,
  activeId,
  columnWidth = 'w-40',
}: AncestorColumnsProps) {
  return (
    <>
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
            activeId={activeId}
            className={columnWidth}
          />
        </div>
      )}
    </>
  );
}
