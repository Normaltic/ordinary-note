import { useNavStore } from '../stores/nav.store';

export function HamburgerButton() {
  const toggle = useNavStore((s) => s.toggle);
  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-hover"
      aria-label="내비게이션 열기"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="3" y1="5" x2="17" y2="5" />
        <line x1="3" y1="10" x2="17" y2="10" />
        <line x1="3" y1="15" x2="17" y2="15" />
      </svg>
    </button>
  );
}
