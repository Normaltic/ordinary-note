import { Link } from 'react-router-dom';

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
  return (
    <div className="flex w-12 shrink-0 flex-col items-center bg-bg-frame py-3 gap-1">
      {/* Finder — active */}
      <Link
        to="/"
        className="group relative flex h-10 w-10 items-center justify-center rounded-md text-accent"
        aria-label="탐색"
      >
        {/* Left indicator */}
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 4h4l2 2h8v10H3V4z" />
        </svg>
        <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-bg-card px-2 py-1 text-xs text-text-primary shadow-float border border-border-default group-hover:block z-[var(--z-index-context-menu)]">
          탐색
        </span>
      </Link>

      {/* Home — disabled */}
      <DisabledRailIcon label="홈">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10l7-7 7 7" />
          <path d="M5 8v8h4v-4h2v4h4V8" />
        </svg>
      </DisabledRailIcon>

      {/* Pin — disabled */}
      <DisabledRailIcon label="핀">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v6M7 8h6l-1 5H8L7 8zM10 13v5" />
        </svg>
      </DisabledRailIcon>

      {/* Recent — disabled */}
      <DisabledRailIcon label="최근">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="7" />
          <path d="M10 6v4l3 2" />
        </svg>
      </DisabledRailIcon>

      {/* Trash — disabled */}
      <DisabledRailIcon label="휴지통">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 6h10M8 6V4h4v2M6 6l1 10h6l1-10" />
        </svg>
      </DisabledRailIcon>
    </div>
  );
}
