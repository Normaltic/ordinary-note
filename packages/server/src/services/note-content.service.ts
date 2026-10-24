import { XmlElement, type Doc, type XmlFragment } from 'yjs';
import type { CollaborationServer } from '../collaboration/index.js';
import type { NoteService } from './note.service.js';
import { yFragmentToMarkdown } from '../utils/markdown/yjs-to-markdown.js';
import {
  markdownToYFragment,
  parseMarkdownToElements,
} from '../utils/markdown/markdown-to-yjs.js';
import {
  applyContentUpdates,
  type ContentUpdate,
} from '../utils/markdown/content-updater.js';
import { ValidationError } from '../utils/errors.js';

const LIST_TYPES = new Set(['bulletList', 'orderedList', 'taskList']);

/**
 * index 위치의 리스트가 직전 블록과 같은 종류의 리스트면 하나로 합친다.
 * (append로 항목을 하나씩 쌓을 때 리스트가 분리되지 않도록)
 */
function mergeWithPreviousList(fragment: XmlFragment, index: number): void {
  if (index === 0) return;
  const prev = fragment.get(index - 1);
  const next = fragment.get(index);
  if (
    prev instanceof XmlElement &&
    next instanceof XmlElement &&
    prev.nodeName === next.nodeName &&
    LIST_TYPES.has(prev.nodeName)
  ) {
    const items = next
      .toArray()
      .filter((item): item is XmlElement => item instanceof XmlElement);
    prev.push(items.map((item) => item.clone()));
    fragment.delete(index, 1);
  }
}

/** 새 노트처럼 빈 문단 하나만 있는 문서인지 */
function isBlankDocument(fragment: XmlFragment): boolean {
  if (fragment.length !== 1) return false;
  const only = fragment.get(0);
  return (
    only instanceof XmlElement &&
    only.nodeName === 'paragraph' &&
    only.length === 0
  );
}

/**
 * 노트 본문(Yjs 문서)을 마크다운으로 읽고 쓴다.
 * Hocuspocus direct connection을 사용하므로 접속 중인 클라이언트에 실시간 반영된다.
 */
export class NoteContentService {
  constructor(
    private readonly noteService: NoteService,
    private readonly getCollaboration: () => CollaborationServer,
  ) {}

  async getMarkdown(userId: string, noteId: string): Promise<string> {
    await this.noteService.getById(userId, noteId);
    let markdown = '';
    await this.transact(noteId, (doc) => {
      markdown = yFragmentToMarkdown(doc.getXmlFragment('default'));
    });
    return markdown;
  }

  async replace(
    userId: string,
    noteId: string,
    markdown: string,
  ): Promise<void> {
    await this.noteService.getById(userId, noteId);
    await this.transact(noteId, (doc) => {
      const fragment = doc.getXmlFragment('default');
      fragment.delete(0, fragment.length);
      markdownToYFragment(markdown, fragment);
    });
  }

  /**
   * 본문 끝에 마크다운을 덧붙인다.
   * 빈 문서면 빈 문단을 대체하고, 끝의 리스트와 같은 종류의 리스트는 이어 붙인다.
   */
  async append(
    userId: string,
    noteId: string,
    markdown: string,
  ): Promise<void> {
    const elements = parseMarkdownToElements(markdown);
    if (elements.length === 0) {
      throw new ValidationError('추가할 내용이 비어 있습니다');
    }
    await this.noteService.getById(userId, noteId);
    await this.transact(noteId, (doc) => {
      const fragment = doc.getXmlFragment('default');
      if (isBlankDocument(fragment)) fragment.delete(0, 1);
      const insertAt = fragment.length;
      fragment.push(elements);
      mergeWithPreviousList(fragment, insertAt);
    });
  }

  async applyUpdates(
    userId: string,
    noteId: string,
    updates: ContentUpdate[],
  ): Promise<void> {
    await this.noteService.getById(userId, noteId);
    await this.transact(noteId, (doc) => {
      applyContentUpdates(doc.getXmlFragment('default'), updates);
    });
  }

  private async transact(
    noteId: string,
    fn: (doc: Doc) => void,
  ): Promise<void> {
    const connection =
      await this.getCollaboration().openDirectConnection(noteId);
    try {
      await connection.transact(fn);
    } finally {
      await connection.disconnect();
    }
  }
}
