import type { XmlFragment } from 'yjs';
import { XmlElement } from 'yjs';
import { blockToMarkdown } from './yjs-to-markdown.js';
import { parseMarkdownToElements } from './markdown-to-yjs.js';

export interface ContentUpdate {
  old_content: string;
  new_content: string;
}

interface BlockBoundary {
  start: number;
  end: number;
}

interface ResolvedUpdate {
  blockStart: number;
  blockEnd: number; // inclusive
  rangeMarkdown: string;
  oldContent: string;
  newContent: string;
}

export function applyContentUpdates(
  fragment: XmlFragment,
  updates: ContentUpdate[],
): void {
  if (updates.length === 0) return;

  const blockMarkdowns = getBlockMarkdowns(fragment);
  const fullMarkdown = blockMarkdowns.join('\n\n');
  const boundaries = buildBlockBoundaries(blockMarkdowns);

  const resolved = resolveUpdates(
    updates,
    fullMarkdown,
    blockMarkdowns,
    boundaries,
  );

  checkOverlaps(resolved);

  // Sort by blockStart descending to apply from the end
  resolved.sort((a, b) => b.blockStart - a.blockStart);

  for (const update of resolved) {
    applyUpdate(fragment, update);
  }
}

function getBlockMarkdowns(fragment: XmlFragment): string[] {
  const result: string[] = [];
  for (let i = 0; i < fragment.length; i++) {
    const child = fragment.get(i);
    if (child instanceof XmlElement) {
      result.push(blockToMarkdown(child, 0) ?? '');
    } else {
      result.push('');
    }
  }
  return result;
}

function buildBlockBoundaries(blockMarkdowns: string[]): BlockBoundary[] {
  const boundaries: BlockBoundary[] = [];
  let pos = 0;

  for (let i = 0; i < blockMarkdowns.length; i++) {
    const len = blockMarkdowns[i].length;
    boundaries.push({ start: pos, end: pos + len });
    pos += len + 2; // +2 for '\n\n' separator
  }

  return boundaries;
}

function resolveUpdates(
  updates: ContentUpdate[],
  fullMarkdown: string,
  blockMarkdowns: string[],
  boundaries: BlockBoundary[],
): ResolvedUpdate[] {
  return updates.map((update) => {
    // Handle empty document insertion
    if (update.old_content === '') {
      return resolveEmptyDocUpdate(
        update,
        fullMarkdown,
        blockMarkdowns,
        boundaries,
      );
    }

    const matchIndices = findAllOccurrences(fullMarkdown, update.old_content);

    if (matchIndices.length === 0) {
      throw new Error(
        `old_content를 찾을 수 없습니다: "${truncate(update.old_content, 50)}"`,
      );
    }

    if (matchIndices.length > 1) {
      throw new Error(
        `old_content가 여러 곳에서 발견됩니다. 더 많은 컨텍스트를 포함해주세요: "${truncate(update.old_content, 50)}"`,
      );
    }

    const matchStart = matchIndices[0];
    const matchEnd = matchStart + update.old_content.length;

    const blockStart = findBlockIndex(boundaries, matchStart);
    const blockEnd = findBlockIndex(boundaries, matchEnd - 1);

    const rangeMarkdown = blockMarkdowns.slice(blockStart, blockEnd + 1).join('\n\n');

    return {
      blockStart,
      blockEnd,
      rangeMarkdown,
      oldContent: update.old_content,
      newContent: update.new_content,
    };
  });
}

function resolveEmptyDocUpdate(
  update: ContentUpdate,
  fullMarkdown: string,
  blockMarkdowns: string[],
  _boundaries: BlockBoundary[],
): ResolvedUpdate {
  // Only allow empty old_content when the document is effectively empty
  const isEmptyDoc =
    blockMarkdowns.length === 0 ||
    (blockMarkdowns.length === 1 && blockMarkdowns[0] === '');

  if (!isEmptyDoc) {
    throw new Error(
      'old_content가 빈 문자열이지만 문서가 비어있지 않습니다. 수정할 부분을 지정해주세요.',
    );
  }

  return {
    blockStart: 0,
    blockEnd: blockMarkdowns.length - 1, // -1 when empty → count becomes 0
    rangeMarkdown: fullMarkdown,
    oldContent: '',
    newContent: update.new_content,
  };
}

function checkOverlaps(resolved: ResolvedUpdate[]): void {
  for (let i = 0; i < resolved.length; i++) {
    for (let j = i + 1; j < resolved.length; j++) {
      const a = resolved[i];
      const b = resolved[j];
      if (a.blockStart <= b.blockEnd && b.blockStart <= a.blockEnd) {
        throw new Error(
          'content_updates의 블록 범위가 겹칩니다. 겹치지 않도록 수정해주세요.',
        );
      }
    }
  }
}

function applyUpdate(fragment: XmlFragment, update: ResolvedUpdate): void {
  const count = update.blockEnd - update.blockStart + 1;

  // Perform string replacement within the block range
  const replaced = update.rangeMarkdown.replace(
    update.oldContent,
    update.newContent,
  );

  // Delete old blocks
  if (count > 0) {
    fragment.delete(update.blockStart, count);
  }

  // Insert new blocks (if non-empty replacement)
  const trimmed = replaced.trim();
  if (trimmed) {
    const newElements = parseMarkdownToElements(trimmed);
    if (newElements.length > 0) {
      fragment.insert(update.blockStart, newElements);
    }
  }
}

function findAllOccurrences(text: string, search: string): number[] {
  const indices: number[] = [];
  let pos = 0;
  while (pos <= text.length - search.length) {
    const idx = text.indexOf(search, pos);
    if (idx === -1) break;
    indices.push(idx);
    pos = idx + 1;
  }
  return indices;
}

function findBlockIndex(boundaries: BlockBoundary[], charPos: number): number {
  for (let i = 0; i < boundaries.length; i++) {
    if (charPos >= boundaries[i].start && charPos < boundaries[i].end) {
      return i;
    }
    // Position falls in the separator between blocks → belongs to the next block
    if (
      i < boundaries.length - 1 &&
      charPos >= boundaries[i].end &&
      charPos < boundaries[i + 1].start
    ) {
      return i + 1;
    }
  }
  // If charPos is at the very end of the last block
  if (boundaries.length > 0) {
    const last = boundaries[boundaries.length - 1];
    if (charPos === last.end) {
      return boundaries.length - 1;
    }
  }
  return 0;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '...';
}
