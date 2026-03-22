import { Link } from 'react-router-dom';
import type { SearchResult } from '../api/searchNotes';
import { highlightSnippet, extractSnippet } from '../utils/highlightSnippet';

interface SearchResultItemProps {
  id: string;
  result: SearchResult;
  query: string;
  active: boolean;
  onClick?: () => void;
}

export function SearchResultItem({
  id,
  result,
  query,
  active,
  onClick,
}: SearchResultItemProps) {
  const titleParts = highlightSnippet(result.title || '제목 없음', query);
  const snippet = extractSnippet(result.contentPlain, query);
  const snippetParts = snippet ? highlightSnippet(snippet, query) : [];

  return (
    <Link
      id={id}
      role="option"
      aria-selected={active}
      to={`/notes/${result.id}`}
      onClick={onClick}
      className={`block px-3 py-2 transition-colors ${
        active ? 'bg-bg-hover' : 'hover:bg-bg-hover'
      }`}
    >
      <div className="text-sm text-text-primary">
        {titleParts.map((part, i) => (
          <span
            key={i}
            className={part.highlight ? 'font-semibold text-accent' : ''}
          >
            {part.text}
          </span>
        ))}
      </div>

      {result.folderName && (
        <div className="mt-0.5 text-xs text-text-muted truncate">
          {result.folderName}
        </div>
      )}

      {snippetParts.length > 0 && (
        <div className="mt-0.5 text-xs text-text-secondary truncate">
          {snippetParts.map((part, i) => (
            <span
              key={i}
              className={part.highlight ? 'font-semibold text-accent' : ''}
            >
              {part.text}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
