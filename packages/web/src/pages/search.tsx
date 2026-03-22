import { useSearchParams } from 'react-router-dom';
import { useSearchQuery } from '../features/search/hooks/useSearch';
import { SearchResultCard } from '../features/search/components/SearchResultCard';
import { SidebarToggle } from '../features/layout/SidebarToggle';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const { data: results = [], isLoading } = useSearchQuery(query);

  return (
    <>
      <div className="flex items-center px-4 py-3 lg:hidden">
        <SidebarToggle />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[var(--max-content-width)] px-6 py-6">
          <h1 className="text-lg font-semibold text-text-primary">
            &ldquo;{query}&rdquo; 검색 결과
          </h1>

          {isLoading && (
            <p className="mt-4 text-sm text-text-muted">검색 중...</p>
          )}

          {!isLoading && results.length === 0 && query && (
            <p className="mt-4 text-sm text-text-muted">
              검색 결과가 없습니다
            </p>
          )}

          {!isLoading && results.length > 0 && (
            <>
              <p className="mt-1 text-sm text-text-muted">
                {results.length}개의 결과
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {results.map((result) => (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    query={query}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
