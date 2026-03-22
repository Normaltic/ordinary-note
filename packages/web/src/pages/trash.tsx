import { SidebarToggle } from '../features/layout/SidebarToggle';
import { TrashNotes } from '../features/trash/TrashNotes';

export function TrashPage() {
  return (
    <>
      <div className="flex items-center px-4 py-3 lg:hidden">
        <SidebarToggle />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[var(--max-content-width)] px-6 py-6">
          <TrashNotes />
        </div>
      </div>
    </>
  );
}
