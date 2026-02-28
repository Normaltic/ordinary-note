import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth.store';
import { useAuth } from '../../auth/hooks/useAuth';
import { useClickOutside } from '../../../hooks/useClickOutside';
import FolderIcon from '../../../components/icons/folder.svg?react';
import HomeIcon from '../../../components/icons/home.svg?react';
import PinIcon from '../../../components/icons/pin.svg?react';
import ClockIcon from '../../../components/icons/clock.svg?react';
import TrashIcon from '../../../components/icons/trash.svg?react';

interface RailIconProps {
  label: string;
  children: React.ReactNode;
}

function DisabledRailIcon({ label, children }: RailIconProps) {
  return (
    <span
      className="group relative flex h-10 w-10 items-center justify-center text-text-muted"
      aria-label={label}
    >
      {children}
      <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-bg-card px-2 py-1 text-xs text-text-primary shadow-float border border-border-default group-hover:block z-[var(--z-index-context-menu)]">
        {label}
      </span>
    </span>
  );
}

export function IconRail() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeDropdown = useCallback(() => setDropdownOpen(false), []);
  useClickOutside(dropdownRef, closeDropdown);

  return (
    <div className="flex shrink-0 flex-col items-center bg-bg-frame px-2 gap-2">
      {/* Finder — active */}
      <Link
        to="/"
        className="group relative flex h-10 w-10 items-center justify-center rounded-md text-accent"
        aria-label="탐색"
      >
        {/* Left indicator */}
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
        <FolderIcon className="size-6" />
        <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-bg-card px-2 py-1 text-xs text-text-primary shadow-float border border-border-default group-hover:block z-[var(--z-index-context-menu)]">
          탐색
        </span>
      </Link>

      {/* Home — disabled */}
      <DisabledRailIcon label="홈">
        <HomeIcon className="size-6" />
      </DisabledRailIcon>

      {/* Pin — disabled */}
      <DisabledRailIcon label="핀">
        <PinIcon className="size-6" />
      </DisabledRailIcon>

      {/* Recent — disabled */}
      <DisabledRailIcon label="최근">
        <ClockIcon className="size-6" />
      </DisabledRailIcon>

      {/* Trash — disabled */}
      <DisabledRailIcon label="휴지통">
        <TrashIcon className="size-6" />
      </DisabledRailIcon>

      {/* User profile — bottom */}
      {user && (
        <div ref={dropdownRef} className="relative mt-auto mb-2">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-pill bg-accent-subtle text-xs font-semibold text-accent transition-colors hover:bg-accent-muted"
            aria-label="사용자 메뉴"
          >
            {user.name.charAt(0)}
          </button>

          {dropdownOpen && (
            <div className="absolute bottom-0 left-full ml-2 z-[var(--z-index-context-menu)] w-44 rounded-md border border-border-default bg-bg-card shadow-float py-1">
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
  );
}
