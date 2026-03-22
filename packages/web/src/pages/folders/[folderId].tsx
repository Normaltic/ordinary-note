import { useParams } from 'react-router-dom';
import { SidebarToggle } from '../../features/layout/SidebarToggle';
import { Breadcrumb } from '../../components/Breadcrumb';
import { useFolderPath } from '../../hooks/queries/useFolder';
import { ColumnLayout } from '../../features/layout/ColumnLayout';
import { FinderView } from '../../features/finder/FinderView';

export function FolderPage() {
  const { folderId } = useParams();
  const segments = useFolderPath(folderId ?? null);

  return (
    <ColumnLayout folderId={folderId ?? null} columnWidth="w-80">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border-light px-4 py-3 lg:hidden">
          <SidebarToggle />
          <Breadcrumb segments={segments} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[var(--max-content-width)] px-6 py-6">
            <FinderView folderId={folderId} />
          </div>
        </div>
      </div>
    </ColumnLayout>
  );
}
