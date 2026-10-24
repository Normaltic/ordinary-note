import type { FolderTreeNode } from '@ordinary-note/shared';
import type { FolderService } from './folder.service.js';
import type { NoteService } from './note.service.js';
import type { NoteContentService } from './note-content.service.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { findFolderNode } from '../utils/folder-tree.js';

export interface BulkNoteInput {
  title?: string;
  content?: string;
  /** parentFolderId 기준 상대 폴더 경로 (생략 시 parentFolderId 바로 아래) */
  folder?: string[];
}

type ItemError = { code: string; message: string };

export type BulkNoteResult =
  | { index: number; id: string }
  | { index: number; id?: string; error: ItemError };

export interface BulkCreateResult {
  folders: { path: string; id: string; created: boolean }[];
  notes: BulkNoteResult[];
  summary: { notesCreated: number; notesFailed: number };
}

function toItemError(e: unknown): ItemError {
  if (e instanceof AppError) return { code: e.code, message: e.message };
  logger.error({ err: e }, 'Unexpected bulk create item error');
  return { code: 'SERVER_INTERNAL', message: 'Internal server error' };
}

/**
 * 경로 기반 폴더 해석기. 경로상 폴더가 있으면 재사용하고 없으면 생성한다 (mkdir -p).
 * 같은 호출 안에서 만든 폴더도 캐시해 중복 생성하지 않는다.
 */
function createFolderResolver(
  folderService: FolderService,
  userId: string,
  parent: FolderTreeNode,
) {
  // folderId → (자식 이름 → 자식 id)
  const childrenByFolder = new Map<string, Map<string, string>>();
  const index = (node: FolderTreeNode) => {
    const names = new Map<string, string>();
    for (const child of node.children) {
      if (!names.has(child.name)) names.set(child.name, child.id);
      index(child);
    }
    childrenByFolder.set(node.id, names);
  };
  index(parent);

  const resolved = new Map<string, { id: string; created: boolean }>();

  async function resolve(path: string[]): Promise<string> {
    let currentId = parent.id;
    for (let depth = 0; depth < path.length; depth++) {
      const name = path[depth];
      const children = childrenByFolder.get(currentId)!;
      let childId = children.get(name);
      if (!childId) {
        const folder = await folderService.create(userId, {
          name,
          parentId: currentId,
        });
        childId = folder.id;
        children.set(name, childId);
        childrenByFolder.set(childId, new Map());
        resolved.set(path.slice(0, depth + 1).join('/'), {
          id: childId,
          created: true,
        });
      }
      currentId = childId;
    }
    const key = path.join('/');
    if (key && !resolved.has(key)) {
      resolved.set(key, { id: currentId, created: false });
    }
    return currentId;
  }

  return { resolve, resolved };
}

export interface BulkCreateInput {
  parentFolderId: string;
  notes: BulkNoteInput[];
  folders?: string[][];
}

/** 폴더 경로를 포함한 노트 일괄 생성. 항목별로 독립 처리하고 결과를 모아 반환한다 */
export class BulkNoteService {
  constructor(
    private readonly folderService: FolderService,
    private readonly noteService: NoteService,
    private readonly noteContentService: NoteContentService,
  ) {}

  async create(
    userId: string,
    input: BulkCreateInput,
  ): Promise<BulkCreateResult> {
    const tree = await this.folderService.getTree(userId);
    const parent = findFolderNode(tree, input.parentFolderId);
    if (!parent) throw new NotFoundError('Folder');

    const { resolve, resolved } = createFolderResolver(
      this.folderService,
      userId,
      parent,
    );

    const notes: BulkNoteResult[] = [];
    for (const [index, item] of input.notes.entries()) {
      let noteId: string | undefined;
      try {
        const folderId = await resolve(item.folder ?? []);
        const note = await this.noteService.create(userId, {
          folderId,
          title: item.title,
        });
        noteId = note.id;
        if (item.content) {
          await this.noteContentService.replace(userId, note.id, item.content);
        }
        notes.push({ index, id: note.id });
      } catch (e) {
        notes.push({
          index,
          ...(noteId && { id: noteId }),
          error: toItemError(e),
        });
      }
    }

    // 노트 없는 폴더는 노트 처리 후 생성 (입력 순서대로 정렬되도록).
    // 실패 시 전체 에러로 반환하며, 재호출 시 이미 만든 폴더는 재사용됨
    for (const path of input.folders ?? []) {
      await resolve(path);
    }

    const notesFailed = notes.filter((n) => 'error' in n).length;
    return {
      folders: [...resolved].map(([path, f]) => ({ path, ...f })),
      notes,
      summary: { notesCreated: notes.length - notesFailed, notesFailed },
    };
  }
}
