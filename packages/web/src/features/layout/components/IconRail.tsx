import { useState, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth.store';
import { useAuth } from '../../auth/hooks/useAuth';
import { useClickOutside } from '../../../hooks/useClickOutside';
import FolderIcon from '../../../assets/icons/folder.svg?react';
import HomeIcon from '../../../assets/icons/home.svg?react';
import PinIcon from '../../../assets/icons/pin.svg?react';
import ClockIcon from '../../../assets/icons/clock.svg?react';
import TrashIcon from '../../../assets/icons/trash.svg?react';

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

interface ActiveRailIconProps extends RailIconProps {
  to: string;
  isActive: boolean;
}

function ActiveRailIcon({ to, label, isActive, children }: ActiveRailIconProps) {
  return (
    <Link
      to={to}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-md ${isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary'}`}
      aria-label={label}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
      )}
      {children}
      <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-bg-card px-2 py-1 text-xs text-text-primary shadow-float border border-border-default group-hover:block z-[var(--z-index-context-menu)]">
        {label}
      </span>
    </Link>
  );
}

export function IconRail() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const isFinderActive = pathname === '/' || pathname.startsWith('/folders') || pathname.startsWith('/notes');
  const isPinnedActive = pathname.startsWith('/pinned');
  const isRecentActive = pathname.startsWith('/recent');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeDropdown = useCallback(() => setDropdownOpen(false), []);
  useClickOutside(dropdownRef, closeDropdown);

  return (
    <div className="flex shrink-0 flex-col items-center bg-bg-frame px-2 gap-2">
      {/* Finder */}
      <ActiveRailIcon to="/" label="탐색" isActive={isFinderActive}>
        <FolderIcon className="size-6" />
      </ActiveRailIcon>

      {/* Home — disabled */}
      <DisabledRailIcon label="홈">
        <HomeIcon className="size-6" />
      </DisabledRailIcon>

      {/* Pin */}
      <ActiveRailIcon to="/pinned" label="핀" isActive={isPinnedActive}>
        <PinIcon className="size-6" />
      </ActiveRailIcon>

      {/* Recent */}
      <ActiveRailIcon to="/recent" label="최근" isActive={isRecentActive}>
        <ClockIcon className="size-6" />
      </ActiveRailIcon>

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
