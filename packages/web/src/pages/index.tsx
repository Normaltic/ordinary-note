import { FinderView } from '../features/finder/FinderView';

export function IndexPage() {
  return (
    <div className="mx-auto w-full max-w-[var(--max-content-width)] px-6 py-6">
      <FinderView />
    </div>
  );
}
