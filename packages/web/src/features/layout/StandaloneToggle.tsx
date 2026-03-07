import { useStandalone } from './hooks/useStandalone';
import SidebarIcon from '../../assets/icons/sidebar.svg?react';
import SidebarCollapseIcon from '../../assets/icons/sidebar-collapse.svg?react';

export function StandaloneToggle() {
  const { standalone, toggleStandalone } = useStandalone();

  return (
    <button
      onClick={toggleStandalone}
      className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
      aria-label={standalone ? '사이드바 열기' : '사이드바 닫기'}
    >
      {standalone ? (
        <SidebarIcon className="size-[18px]" />
      ) : (
        <SidebarCollapseIcon className="size-[18px]" />
      )}
    </button>
  );
}
