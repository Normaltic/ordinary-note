import { useState, useRef, useCallback, useId } from 'react';
import { useSortStore, type SortOption } from '../../../stores/sort.store';
import { useClickOutside } from '../../../hooks/useClickOutside';
import ArrowUpDownIcon from '../../../assets/icons/arrow-up-down.svg?react';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name', label: '이름순' },
  { value: 'updatedAt', label: '최근 수정순' },
  { value: 'createdAt', label: '생성일순' },
];

export function SortDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sortBy = useSortStore((s) => s.sortBy);
  const setSortBy = useSortStore((s) => s.setSortBy);
  const listboxId = useId();

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  const currentLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`정렬: ${currentLabel}`}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        <ArrowUpDownIcon className="size-4" aria-hidden />
        <span className="hidden xl:inline">{currentLabel}</span>
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="정렬 옵션"
          className="absolute right-0 top-full mt-1 z-[var(--z-index-context-menu)] w-36 rounded-md border border-border-default bg-bg-card py-1 shadow-float"
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              role="option"
              aria-selected={sortBy === option.value}
              onClick={() => {
                setSortBy(option.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-bg-hover ${
                sortBy === option.value
                  ? 'text-accent font-medium'
                  : 'text-text-secondary'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
