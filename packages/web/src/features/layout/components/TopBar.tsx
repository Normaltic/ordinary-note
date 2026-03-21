import SearchIcon from '../../../assets/icons/search.svg?react';
import { SortDropdown } from './SortDropdown';

export function TopBar() {
  return (
    <div className="hidden lg:flex h-[var(--toolbar-height)] shrink-0 items-center bg-bg-frame px-3">
      {/* Left spacer: matches rail width */}
      <div className="w-[var(--rail-width)] shrink-0" />

      {/* Center: search input placeholder */}
      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-md items-center gap-2 rounded-md bg-bg-page/60 px-3 py-1.5 text-sm text-text-muted">
          <SearchIcon className="size-4 shrink-0" />
          <span>검색...</span>
        </div>
      </div>

      {/* Right: sort dropdown */}
      <div className="ml-3 shrink-0">
        <SortDropdown />
      </div>
    </div>
  );
}
