import { FinderToolbar } from '../features/finder/components/FinderToolbar';
import { FinderPageContent } from '../features/finder/FinderPageContent';

export function IndexPage() {
  return (
    <>
      <FinderToolbar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <FinderPageContent />
      </div>
    </>
  );
}
