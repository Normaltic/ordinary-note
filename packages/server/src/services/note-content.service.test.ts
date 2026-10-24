import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Doc, type XmlElement } from 'yjs';
import { NoteContentService } from './note-content.service.js';
import type { NoteService } from './note.service.js';
import { createMockCollaboration, fixtures } from '../testing/helpers.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

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

describe('NoteContentService', () => {
  let noteService: { getById: ReturnType<typeof vi.fn> };
  let collaboration: ReturnType<typeof createMockCollaboration>;
  let disconnect: ReturnType<typeof vi.fn>;
  let doc: Doc;
  let service: NoteContentService;

  beforeEach(() => {
    noteService = { getById: vi.fn().mockResolvedValue(fixtures.note()) };
    collaboration = createMockCollaboration();
    disconnect = vi.fn();
    doc = new Doc();
    collaboration.openDirectConnection.mockResolvedValue({
      transact: async (fn: (d: Doc) => void) => fn(doc),
      disconnect,
    });
    service = new NoteContentService(
      noteService as unknown as NoteService,
      () => collaboration as never,
    );
  });

  it('replace 후 getMarkdown으로 같은 내용을 읽는다', async () => {
    await service.replace('user-1', 'note-1', '# 제목\n\n본문');
    const markdown = await service.getMarkdown('user-1', 'note-1');

    expect(markdown).toContain('# 제목');
    expect(markdown).toContain('본문');
    expect(disconnect).toHaveBeenCalledTimes(2);
  });

  it('replace는 기존 내용을 모두 교체한다', async () => {
    await service.replace('user-1', 'note-1', '이전 내용');
    await service.replace('user-1', 'note-1', '새 내용');
    const markdown = await service.getMarkdown('user-1', 'note-1');

    expect(markdown).not.toContain('이전 내용');
    expect(markdown).toContain('새 내용');
  });

  it('applyUpdates로 부분 수정한다', async () => {
    await service.replace('user-1', 'note-1', '첫 문단\n\n둘째 문단');
    await service.applyUpdates('user-1', 'note-1', [
      { old_content: '둘째 문단', new_content: '수정된 문단' },
    ]);
    const markdown = await service.getMarkdown('user-1', 'note-1');

    expect(markdown).toContain('첫 문단');
    expect(markdown).toContain('수정된 문단');
  });

  it('append는 기존 본문 뒤에 덧붙인다', async () => {
    await service.replace('user-1', 'note-1', '# 일지');
    await service.append('user-1', 'note-1', '- 10/24 운동');
    await service.append('user-1', 'note-1', '- 10/25 휴식');
    const markdown = await service.getMarkdown('user-1', 'note-1');

    expect(markdown.indexOf('# 일지')).toBeLessThan(markdown.indexOf('10/24'));
    expect(markdown.indexOf('10/24')).toBeLessThan(markdown.indexOf('10/25'));
  });

  it('append는 끝의 리스트와 같은 종류면 이어 붙이고, 다르면 분리한다', async () => {
    await service.replace('user-1', 'note-1', '- 스쿼트');
    await service.append('user-1', 'note-1', '- 데드리프트');
    await service.append('user-1', 'note-1', '- [ ] 러닝');
    const fragment = doc.getXmlFragment('default');

    expect(fragment.length).toBe(2);
    const [bullets, tasks] = [0, 1].map((i) => fragment.get(i) as XmlElement);
    expect(bullets.nodeName).toBe('bulletList');
    expect(bullets.length).toBe(2);
    expect(tasks.nodeName).toBe('taskList');
    expect(await service.getMarkdown('user-1', 'note-1')).toContain(
      '- 스쿼트\n- 데드리프트',
    );
  });

  it('append는 빈 문서의 빈 문단을 대체한다', async () => {
    await service.replace('user-1', 'note-1', '');
    await service.append('user-1', 'note-1', '첫 줄');
    const fragment = doc.getXmlFragment('default');

    expect(fragment.length).toBe(1);
    expect(fragment.toString()).toContain('첫 줄');
  });

  it('append에 빈 내용을 주면 문서에 접근하지 않고 ValidationError', async () => {
    await expect(service.append('user-1', 'note-1', '  \n ')).rejects.toThrow(
      ValidationError,
    );
    expect(noteService.getById).not.toHaveBeenCalled();
  });

  it('소유권 검증 실패 시 문서에 접근하지 않는다', async () => {
    noteService.getById.mockRejectedValue(new NotFoundError('Note'));

    await expect(service.replace('user-1', 'note-x', 'x')).rejects.toThrow(
      NotFoundError,
    );
    expect(collaboration.openDirectConnection).not.toHaveBeenCalled();
  });

  it('편집 중 에러가 나도 연결을 해제한다', async () => {
    await expect(
      service.applyUpdates('user-1', 'note-1', [
        { old_content: '없는 내용', new_content: 'x' },
      ]),
    ).rejects.toThrow(ValidationError);
    expect(disconnect).toHaveBeenCalled();
  });
});
