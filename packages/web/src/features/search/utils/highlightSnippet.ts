export interface SnippetPart {
  text: string;
  highlight: boolean;
}

export function highlightSnippet(
  text: string,
  query: string,
): SnippetPart[] {
  if (!query.trim()) return [{ text, highlight: false }];

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts
    .filter((p) => p.length > 0)
    .map((p) => ({
      text: p,
      highlight: regex.test(p) || p.toLowerCase() === query.toLowerCase(),
    }));
}

export function extractSnippet(
  content: string | null,
  query: string,
  maxLength = 120,
): string {
  if (!content) return '';

  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerContent.indexOf(lowerQuery);

  if (idx === -1) return content.slice(0, maxLength);

  const start = Math.max(0, idx - 30);
  const end = Math.min(content.length, idx + query.length + maxLength - 30);
  const snippet = content.slice(start, end);

  return (start > 0 ? '...' : '') + snippet + (end < content.length ? '...' : '');
}
