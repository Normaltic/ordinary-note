import { FinderToolbar } from '../features/finder/components/FinderToolbar';
import { FinderView } from '../features/finder/FinderView';

export function IndexPage() {
  return (
    <>
      <FinderToolbar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[var(--max-content-width)] px-6 py-6">
          <FinderView />
        </div>
      </div>
    </>
  );
}
