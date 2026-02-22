import { Link } from 'react-router-dom';
import type { ColumnData } from '../../hooks/useAncestorColumns';

interface NavColumnProps {
  column: ColumnData;
  onNavigate?: () => void;
}

export function NavColumn({ column, onNavigate }: NavColumnProps) {
  return (
    <div className="flex w-40 shrink-0 flex-col border-r border-border-default bg-bg-sidebar">
      <nav className="flex-1 overflow-y-auto py-2">
        {column.items.map((item) => {
          const isActive = item.id === column.activeId;
          return (
            <Link
              key={item.id}
              to={`/folders/${item.id}`}
              onClick={onNavigate}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors select-none ${
                isActive
                  ? 'bg-accent-subtle text-accent font-medium'
                  : 'text-text-primary hover:bg-bg-hover'
              }`}
            >
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              {item.noteCount > 0 && (
                <span className="shrink-0 text-xs text-text-muted">{item.noteCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
