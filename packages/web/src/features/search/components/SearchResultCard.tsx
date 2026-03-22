import { Link } from 'react-router-dom';
import type { SearchResult } from '../api/searchNotes';
import { highlightSnippet, extractSnippet } from '../utils/highlightSnippet';

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
}

export function SearchResultCard({ result, query }: SearchResultCardProps) {
  const titleParts = highlightSnippet(result.title || '제목 없음', query);
  const snippet = extractSnippet(result.contentPlain, query, 200);
  const snippetParts = snippet ? highlightSnippet(snippet, query) : [];

  return (
    <Link
      to={`/notes/${result.id}`}
      className="block rounded-md border border-border-light bg-bg-card px-4 py-3 transition-colors hover:border-border-default hover:bg-bg-hover"
    >
      <div className="text-base font-medium text-text-primary">
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
        <div className="mt-1 text-xs text-text-muted">{result.folderName}</div>
      )}

      {snippetParts.length > 0 && (
        <div className="mt-1.5 text-sm text-text-secondary line-clamp-2">
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

      <div className="mt-2 text-xs text-text-muted">
        {new Date(result.updatedAt).toLocaleDateString('ko-KR')}
      </div>
    </Link>
  );
}
