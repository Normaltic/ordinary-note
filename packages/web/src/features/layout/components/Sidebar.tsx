import type { ReactNode } from 'react';
import { useNavStore } from '../../../stores/nav.store';
import { IconRail } from './IconRail';

interface SidebarProps {
  children?: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const open = useNavStore((s) => s.open);
  const close = useNavStore((s) => s.close);

  return (
    <>
      {/* Overlay (mobile/tablet) */}
      <div
        className={`fixed inset-0 z-[var(--z-index-sidebar-overlay)] bg-bg-overlay transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={close}
      />

      {/* Nav container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-[var(--z-index-sidebar)] flex transition-transform duration-[var(--transition-timing-sidebar)] lg:relative lg:z-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <IconRail />
        {open && children}
      </aside>
    </>
  );
}
