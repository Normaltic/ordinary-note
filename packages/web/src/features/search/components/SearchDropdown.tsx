import type { SearchResult } from '../api/searchNotes';
import { SearchResultItem } from './SearchResultItem';

interface SearchDropdownProps {
  results: SearchResult[];
  query: string;
  activeIndex: number;
  isLoading: boolean;
  onSelect: () => void;
}

export function SearchDropdown({
  results,
  query,
  activeIndex,
  isLoading,
  onSelect,
}: SearchDropdownProps) {
  if (isLoading) {
    return (
      <div className="absolute left-0 right-0 top-full mt-1 z-[var(--z-index-toolbar-float)] rounded-md border border-border-default bg-bg-card shadow-float py-2">
        <div className="px-3 py-2 text-sm text-text-muted">검색 중...</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-full mt-1 z-[var(--z-index-toolbar-float)] rounded-md border border-border-default bg-bg-card shadow-float py-2">
        <div className="px-3 py-2 text-sm text-text-muted">
          검색 결과가 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 top-full mt-1 z-[var(--z-index-toolbar-float)] rounded-md border border-border-default bg-bg-card shadow-float overflow-hidden py-1">
      {results.map((result, index) => (
        <SearchResultItem
          key={result.id}
          result={result}
          query={query}
          active={index === activeIndex}
          onClick={onSelect}
        />
      ))}
      <div className="border-t border-border-light px-3 py-1.5 text-xs text-text-muted">
        Enter로 전체 결과 보기
      </div>
    </div>
  );
}
