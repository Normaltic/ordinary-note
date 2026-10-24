import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/config.js', () => ({
  config: {
    jwt: {
      accessSecret: 'test-access-secret',
      refreshSecret: 'test-refresh-secret',
      accessExpiresIn: '1h',
      refreshExpiresIn: '14d',
      refreshMaxAge: 14 * 24 * 60 * 60 * 1000,
    },
  },
}));

import { bulkCreateNotes } from './bulk-create.js';
import {
  createMockFolderService,
  createMockNoteService,
  fixtures,
} from '../testing/helpers.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const tree = [
  {
    id: 'parent',
    name: '과업',
    parentId: null,
    sortOrder: 0,
    noteCount: 0,
    children: [
      {
        id: 'existing',
        name: 'S01',
        parentId: 'parent',
        sortOrder: 0,
        noteCount: 0,
        children: [],
      },
    ],
  },
];

describe('bulkCreateNotes', () => {
  let folderService: ReturnType<typeof createMockFolderService>;
  let noteService: ReturnType<typeof createMockNoteService>;
  let noteContentService: { replace: ReturnType<typeof vi.fn> };
  let deps: Parameters<typeof bulkCreateNotes>[0];

  beforeEach(() => {
    folderService = createMockFolderService();
    noteService = createMockNoteService();
    noteContentService = { replace: vi.fn().mockResolvedValue(undefined) };
    folderService.getTree.mockResolvedValue(tree);

    let folderSeq = 0;
    folderService.create.mockImplementation(
      async (_userId: string, data: { name: string; parentId: string }) =>
        fixtures.folder({
          id: `new-${++folderSeq}`,
          name: data.name,
          parentId: data.parentId,
        }),
    );
    let noteSeq = 0;
    noteService.create.mockImplementation(
      async (_userId: string, data: { folderId: string }) =>
        fixtures.note({ id: `note-${++noteSeq}`, folderId: data.folderId }),
    );
    deps = { folderService, noteService, noteContentService } as never;
  });

  it('기존 폴더는 재사용하고 없는 경로는 한 번만 생성한다', async () => {
    const result = await bulkCreateNotes(deps, 'user-1', {
      parentFolderId: 'parent',
      notes: [
        { title: 'a', folder: ['S01'] },
        { title: 'b', folder: ['S02', '회고'] },
        { title: 'c', folder: ['S02', '회고'] },
        { title: 'd' },
      ],
    });

    expect(folderService.create).toHaveBeenCalledTimes(2);
    expect(folderService.create).toHaveBeenNthCalledWith(1, 'user-1', {
      name: 'S02',
      parentId: 'parent',
    });
    expect(folderService.create).toHaveBeenNthCalledWith(2, 'user-1', {
      name: '회고',
      parentId: 'new-1',
    });
    const folderIds = noteService.create.mock.calls.map(
      ([, data]) => (data as { folderId: string }).folderId,
    );
    expect(folderIds).toEqual(['existing', 'new-2', 'new-2', 'parent']);
    expect(result.folders).toEqual([
      { path: 'S01', id: 'existing', created: false },
      { path: 'S02', id: 'new-1', created: true },
      { path: 'S02/회고', id: 'new-2', created: true },
    ]);
    expect(result.summary).toEqual({ notesCreated: 4, notesFailed: 0 });
  });

  it('content가 있는 노트만 본문을 작성한다', async () => {
    await bulkCreateNotes(deps, 'user-1', {
      parentFolderId: 'parent',
      notes: [{ title: 'a', content: '# 본문' }, { title: 'b' }],
    });

    expect(noteContentService.replace).toHaveBeenCalledTimes(1);
    expect(noteContentService.replace).toHaveBeenCalledWith(
      'user-1',
      'note-1',
      '# 본문',
    );
  });

  it('항목 실패는 다른 항목에 영향을 주지 않고 error로 표시한다', async () => {
    noteService.create
      .mockResolvedValueOnce(fixtures.note({ id: 'ok-1' }))
      .mockRejectedValueOnce(new ValidationError('bad title'))
      .mockResolvedValueOnce(fixtures.note({ id: 'ok-3' }));
    noteContentService.replace.mockRejectedValueOnce(new Error('yjs down'));

    const result = await bulkCreateNotes(deps, 'user-1', {
      parentFolderId: 'parent',
      notes: [{ title: 'a', content: 'x' }, { title: 'b' }, { title: 'c' }],
    });

    expect(result.notes).toEqual([
      {
        index: 0,
        id: 'ok-1',
        error: { code: 'SERVER_INTERNAL', message: 'Internal server error' },
      },
      {
        index: 1,
        error: { code: 'VALIDATION_FAILED', message: 'Invalid request' },
      },
      { index: 2, id: 'ok-3' },
    ]);
    expect(result.summary).toEqual({ notesCreated: 1, notesFailed: 2 });
  });

  it('folders로 노트 없는 폴더를 만든다', async () => {
    const result = await bulkCreateNotes(deps, 'user-1', {
      parentFolderId: 'parent',
      notes: [],
      folders: [['빈 폴더']],
    });

    expect(result.folders).toEqual([
      { path: '빈 폴더', id: 'new-1', created: true },
    ]);
  });

  it('기준 폴더가 없으면(타인 폴더 포함) NotFoundError', async () => {
    await expect(
      bulkCreateNotes(deps, 'user-1', { parentFolderId: 'nope', notes: [] }),
    ).rejects.toThrow(NotFoundError);
    expect(folderService.create).not.toHaveBeenCalled();
  });
});
