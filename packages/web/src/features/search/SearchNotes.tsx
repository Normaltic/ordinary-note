import { useSearchQuery } from './hooks/useSearch';
import { SearchResultCard } from './components/SearchResultCard';

interface SearchNotesProps {
  query: string;
}

export function SearchNotes({ query }: SearchNotesProps) {
  const { data: results = [], isLoading } = useSearchQuery(query);

  return (
    <>
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
    </>
  );
}
