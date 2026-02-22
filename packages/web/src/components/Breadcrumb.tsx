import { Link } from 'react-router-dom';

export interface BreadcrumbSegment {
  id: string;
  name: string;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  currentLabel?: string;
}

export function Breadcrumb({ segments, currentLabel }: BreadcrumbProps) {
  const allItems = [
    ...segments.map((s) => ({ label: s.name, to: `/folders/${s.id}` })),
    ...(currentLabel ? [{ label: currentLabel, to: null }] : []),
  ];

  if (allItems.length === 0) return null;

  // Truncate middle items if more than 4 levels
  let displayItems = allItems;
  if (allItems.length > 4) {
    displayItems = [
      allItems[0],
      { label: '...', to: null },
      allItems[allItems.length - 2],
      allItems[allItems.length - 1],
    ];
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-text-secondary">
      <Link to="/" className="transition-colors hover:text-text-primary">
        홈
      </Link>
      {displayItems.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="text-text-muted">›</span>
          {item.to && i < displayItems.length - 1 ? (
            <Link to={item.to} className="transition-colors hover:text-text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-text-primary">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
