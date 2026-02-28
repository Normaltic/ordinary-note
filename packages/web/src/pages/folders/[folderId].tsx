import { useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFolderStore, selectAncestorPath } from '../../stores/folder.store';
import { FolderContentColumn } from '../../features/layout/components/FolderContentColumn';
import { MainHeaderContainer } from '../../features/layout/MainHeaderContainer';
import { FinderPageContent } from '../../features/finder/FinderPageContent';

export function FolderPage() {
  const { folderId } = useParams();
  const ancestorPath = useFolderStore(useShallow(selectAncestorPath(folderId ?? null)));
  const columnIds = ancestorPath.length > 1 ? ancestorPath.slice(0, -1) : [];

  return (
    <div className="flex h-full">
      {/* Desktop columns */}
      {columnIds.length >= 2 && (
        <div className="hidden xl:flex">
          <FolderContentColumn
            folderId={columnIds[columnIds.length - 2]}
            activeId={columnIds[columnIds.length - 1]}
            className="w-80"
          />
        </div>
      )}
      {columnIds.length >= 1 && (
        <div className="hidden lg:flex">
          <FolderContentColumn
            folderId={columnIds[columnIds.length - 1]}
            activeId={ancestorPath[ancestorPath.length - 1]}
            className="w-80"
          />
        </div>
      )}

      {/* Content area (header + finder) */}
      <div className="flex min-w-0 flex-1 flex-col">
        <MainHeaderContainer />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FinderPageContent />
        </div>
      </div>
    </div>
  );
}
