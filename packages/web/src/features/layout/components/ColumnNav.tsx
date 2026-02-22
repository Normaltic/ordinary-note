import type { ColumnData } from '../hooks/useAncestorColumns';
import { IconRail } from './IconRail';
import { NavColumn } from './NavColumn';

interface ColumnNavProps {
  open: boolean;
  onClose: () => void;
  columns: ColumnData[];
}

export function ColumnNav({ open, onClose, columns }: ColumnNavProps) {
  return (
    <>
      {/* Overlay (mobile/tablet) */}
      <div
        className={`fixed inset-0 z-[var(--z-index-sidebar-overlay)] bg-bg-overlay transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Nav container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-[var(--z-index-sidebar)] flex transition-transform duration-[var(--transition-timing-sidebar)] lg:relative lg:z-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <IconRail />

        {/* Second-to-last column: hidden on lg, visible on xl */}
        {columns.length >= 2 && (
          <div className="hidden xl:flex">
            <NavColumn column={columns[columns.length - 2]} onNavigate={onClose} />
          </div>
        )}

        {/* Last column */}
        {columns.length >= 1 && (
          <NavColumn column={columns[columns.length - 1]} onNavigate={onClose} />
        )}
      </aside>
    </>
  );
}
