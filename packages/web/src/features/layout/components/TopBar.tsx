import { SearchInput } from '../../search/components/SearchInput';
import { SortDropdown } from './SortDropdown';

export function TopBar() {
  return (
    <div className="hidden lg:flex h-[var(--toolbar-height)] shrink-0 items-center bg-bg-frame px-3">
      {/* Left spacer: matches rail width */}
      <div className="w-[var(--rail-width)] shrink-0" />

      {/* Center: search input */}
      <div className="flex flex-1 justify-center">
        <SearchInput />
      </div>

      {/* Right: sort dropdown */}
      <div className="ml-3 shrink-0">
        <SortDropdown />
      </div>
    </div>
  );
}
