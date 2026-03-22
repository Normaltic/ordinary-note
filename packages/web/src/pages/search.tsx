import { useSearchParams } from 'react-router-dom';
import { SidebarToggle } from '../features/layout/SidebarToggle';
import { SearchNotes } from '../features/search/SearchNotes';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  return (
    <>
      <div className="flex items-center px-4 py-3 lg:hidden">
        <SidebarToggle />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[var(--max-content-width)] px-6 py-6">
          <SearchNotes query={query} />
        </div>
      </div>
    </>
  );
}
