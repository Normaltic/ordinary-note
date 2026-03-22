import { SidebarToggle } from '../features/layout/SidebarToggle';
import { RecentNotes } from '../features/recent/RecentNotes';

export function RecentPage() {
  return (
    <>
      <div className="flex items-center px-4 py-3 lg:hidden">
        <SidebarToggle />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[var(--max-content-width)] px-6 py-6">
          <h1 className="mb-4 text-lg font-semibold text-text-primary">최근 노트</h1>
          <RecentNotes />
        </div>
      </div>
    </>
  );
}
