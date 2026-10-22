import type { Doc } from 'yjs';
import type { CollaborationServer } from '../collaboration/index.js';
import type { NoteService } from './note.service.js';
import { yFragmentToMarkdown } from '../utils/markdown/yjs-to-markdown.js';
import { markdownToYFragment } from '../utils/markdown/markdown-to-yjs.js';
import {
  applyContentUpdates,
  type ContentUpdate,
} from '../utils/markdown/content-updater.js';

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
