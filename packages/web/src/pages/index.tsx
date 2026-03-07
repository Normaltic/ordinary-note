import { HamburgerButton } from '../features/layout/HamburgerButton';
import { FinderView } from '../features/finder/FinderView';

export function IndexPage() {
  return (
    <>
      <div className="flex items-center px-4 py-3 lg:hidden">
        <HamburgerButton />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[var(--max-content-width)] px-6 py-6">
          <FinderView />
        </div>
      </div>
    </>
  );
}
