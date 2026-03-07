import { useNavStore } from '../../stores/nav.store';
import MenuIcon from '../../components/icons/menu.svg?react';

export function SidebarToggle() {
  const toggle = useNavStore((s) => s.toggle);
  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-hover"
      aria-label="내비게이션 열기"
    >
      <MenuIcon className="size-5" />
    </button>
  );
}
