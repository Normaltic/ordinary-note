import { useState, useRef, useCallback, useEffect, useId } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSearchQuery } from '../hooks/useSearch';
import { useDebounce } from '../hooks/useDebounce';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { SearchDropdown } from './SearchDropdown';
import SearchIcon from '../../../assets/icons/search.svg?react';

const PREVIEW_LIMIT = 7;

export function SearchInput() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const listboxId = useId();

  // Sync query from URL when on search page
  useEffect(() => {
    if (location.pathname === '/search') {
      const q = searchParams.get('q') ?? '';
      setQuery(q);
    }
  }, [location.pathname, searchParams]);

  const debouncedQuery = useDebounce(query, 300);
  const { data: results = [], isLoading } = useSearchQuery(
    debouncedQuery,
    PREVIEW_LIMIT,
  );

  const showDropdown = open && query.trim().length > 0;

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  useClickOutside(containerRef, closeDropdown);

  const navigateToSearch = useCallback(() => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      closeDropdown();
      inputRef.current?.blur();
    }
  }, [query, navigate, closeDropdown]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'Enter') {
        navigateToSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          navigate(`/notes/${results[activeIndex].id}`);
          closeDropdown();
          inputRef.current?.blur();
        } else {
          navigateToSearch();
        }
        break;
      case 'Escape':
        closeDropdown();
        inputRef.current?.blur();
        break;
    }
  };

  const activeOptionId =
    activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-md bg-bg-page/60 px-3 py-1.5 text-sm transition-colors focus-within:bg-bg-page focus-within:ring-2 focus-within:ring-accent/40">
        <SearchIcon className="size-4 shrink-0 text-text-muted" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls={showDropdown ? listboxId : undefined}
          aria-activedescendant={activeOptionId}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="검색..."
          className="w-full bg-transparent text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>

      {showDropdown && (
        <SearchDropdown
          listboxId={listboxId}
          results={results}
          query={debouncedQuery}
          activeIndex={activeIndex}
          isLoading={isLoading && results.length === 0}
          onSelect={closeDropdown}
        />
      )}
    </div>
  );
}
