import { IconRail } from './IconRail';
import { FolderContentColumn } from './FolderContentColumn';

interface ColumnNavProps {
  open: boolean;
  onClose: () => void;
  ancestorPath: string[];
}

export function ColumnNav({ open, onClose, ancestorPath }: ColumnNavProps) {
  // Columns show parents only (exclude the current folder itself)
  const columnIds = ancestorPath.length > 1 ? ancestorPath.slice(0, -1) : [];

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
        {columnIds.length >= 2 && (
          <div className="hidden xl:flex">
            <FolderContentColumn
              folderId={columnIds[columnIds.length - 2]}
              activeId={columnIds[columnIds.length - 1]}
              onNavigate={onClose}
            />
          </div>
        )}

        {/* Last column */}
        {columnIds.length >= 1 && (
          <FolderContentColumn
            folderId={columnIds[columnIds.length - 1]}
            activeId={ancestorPath[ancestorPath.length - 1]}
            onNavigate={onClose}
          />
        )}
      </aside>
    </>
  );
}
