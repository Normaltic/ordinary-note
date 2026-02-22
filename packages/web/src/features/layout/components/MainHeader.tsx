import { useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { useAuth } from '../../auth/hooks/useAuth';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { Breadcrumb } from '../../../components/Breadcrumb';
import type { BreadcrumbSegment } from '../hooks/useFolderPath';

interface MainHeaderProps {
  segments: BreadcrumbSegment[];
  noteLabel?: string;
  folderId: string | null;
  onCreateFolder: () => void;
  onCreateNote: () => void;
  onToggleNav: () => void;
}

export function MainHeader({
  segments,
  noteLabel,
  folderId,
  onCreateFolder,
  onCreateNote,
  onToggleNav,
}: MainHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setDropdownOpen(false), []);
  useClickOutside(dropdownRef, closeDropdown);

  return (
    <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onToggleNav}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-hover lg:hidden"
          aria-label="내비게이션 열기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="3" y1="5" x2="17" y2="5" />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="15" x2="17" y2="15" />
          </svg>
        </button>

        <Breadcrumb segments={segments} currentLabel={noteLabel} />
      </div>

      {/* Right: actions + user */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onCreateFolder}
          className="rounded-pill border border-border-default px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-hover"
        >
          + 새 폴더
        </button>

        {folderId && (
          <button
            onClick={onCreateNote}
            className="rounded-pill bg-accent px-3 py-1.5 text-sm text-text-inverse transition-colors hover:bg-accent-hover"
          >
            + 새 노트
          </button>
        )}

        {/* User dropdown */}
        {user && (
          <div ref={dropdownRef} className="relative ml-1">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-pill bg-accent-subtle text-xs font-semibold text-accent transition-colors hover:bg-accent-muted"
              aria-label="사용자 메뉴"
            >
              {user.name.charAt(0)}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-[var(--z-index-context-menu)] w-44 rounded-md border border-border-default bg-bg-card shadow-float py-1">
                <div className="px-3 py-2 text-sm text-text-secondary truncate">
                  {user.name}
                </div>
                <hr className="border-border-light" />
                <button
                  onClick={logout}
                  className="w-full px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-bg-hover"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
