import { useParams } from 'react-router-dom';
import { ColumnLayout } from '../../features/layout/components/ColumnLayout';
import { FinderToolbar } from '../../features/finder/components/FinderToolbar';
import { FinderView } from '../../features/finder/FinderView';

export function FolderPage() {
  const { folderId } = useParams();

  return (
    <ColumnLayout folderId={folderId ?? null} columnWidth="w-80">
      <div className="flex min-w-0 flex-1 flex-col">
        <FinderToolbar folderId={folderId} showBreadcrumb />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[var(--max-content-width)] px-6 py-6">
            <FinderView />
          </div>
        </div>
      </div>
    </ColumnLayout>
  );
}
