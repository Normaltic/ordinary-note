import type { NoteRecord } from '../repositories/index.js';

/** 목록 응답용 노트 요약 (본문 제외). 본문은 get_note로 조회 */
export function toNoteSummary(note: NoteRecord) {
  return {
    id: note.id,
    title: note.title,
    folderId: note.folderId,
    isPinned: note.isPinned,
    updatedAt: note.updatedAt,
  };
}

const SNIPPET_RADIUS = 60;

/** 검색어 주변 본문 발췌. 본문에 없으면(제목 매칭) 앞부분 */
export function buildSnippet(
  text: string | null,
  query: string,
): string | null {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, ' ').trim();
  const index = normalized.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) {
    return normalized.length > SNIPPET_RADIUS * 2
      ? `${normalized.slice(0, SNIPPET_RADIUS * 2)}…`
      : normalized;
  }
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(
    normalized.length,
    index + query.length + SNIPPET_RADIUS,
  );
  return `${start > 0 ? '…' : ''}${normalized.slice(start, end)}${end < normalized.length ? '…' : ''}`;
}
