import { describe, it, expect } from 'vitest';
import { buildContentUpdates } from './push.js';

describe('buildContentUpdates', () => {
  it('동일한 내용이면 빈 배열을 반환한다', () => {
    const text = 'Hello\n\nWorld';
    expect(buildContentUpdates(text, text)).toEqual([]);
  });

  it('빈 원본에서 새 내용 추가', () => {
    expect(buildContentUpdates('', 'Hello world')).toEqual([
      { old_content: '', new_content: 'Hello world' },
    ]);
  });

  it('앞부분 변경을 감지한다', () => {
    const orig = 'A\n\nB\n\nC';
    const curr = 'X\n\nB\n\nC';
    expect(buildContentUpdates(orig, curr)).toEqual([
      { old_content: 'A', new_content: 'X' },
    ]);
  });

  it('끝부분 변경을 감지한다', () => {
    const orig = 'A\n\nB\n\nC';
    const curr = 'A\n\nB\n\nX';
    expect(buildContentUpdates(orig, curr)).toEqual([
      { old_content: 'C', new_content: 'X' },
    ]);
  });

  it('중간 변경을 감지한다', () => {
    const orig = 'A\n\nB\n\nC';
    const curr = 'A\n\nX\n\nC';
    expect(buildContentUpdates(orig, curr)).toEqual([
      { old_content: 'B', new_content: 'X' },
    ]);
  });

  it('공통 블록으로 분할하여 여러 update를 생성한다', () => {
    // A B C D E → A B' C D' E
    const orig = 'A\n\nB\n\nC\n\nD\n\nE';
    const curr = "A\n\nB'\n\nC\n\nD'\n\nE";
    const updates = buildContentUpdates(orig, curr);
    expect(updates).toEqual([
      { old_content: 'B', new_content: "B'" },
      { old_content: 'D', new_content: "D'" },
    ]);
  });

  it('끝에 블록 추가 시 마지막 블록을 앵커로 사용한다', () => {
    const orig = 'A\n\nB';
    const curr = 'A\n\nB\n\nC';
    const updates = buildContentUpdates(orig, curr);
    expect(updates).toEqual([
      { old_content: 'B', new_content: 'B\n\nC' },
    ]);
  });

  it('끝에 여러 블록 추가를 처리한다', () => {
    const orig = 'A\n\nB\n\nC';
    const curr = 'A\n\nB\n\nC\n\nD\n\nE';
    const updates = buildContentUpdates(orig, curr);
    expect(updates).toEqual([
      { old_content: 'C', new_content: 'C\n\nD\n\nE' },
    ]);
  });

  it('블록 삭제를 처리한다', () => {
    const orig = 'A\n\nB\n\nC';
    const curr = 'A\n\nC';
    const updates = buildContentUpdates(orig, curr);
    expect(updates).toHaveLength(1);
    expect(updates[0].old_content).toBe('B');
    expect(updates[0].new_content).toBe('');
  });

  it('전체 변경을 처리한다', () => {
    const orig = 'A\n\nB';
    const curr = 'X\n\nY';
    const updates = buildContentUpdates(orig, curr);
    expect(updates.length).toBeGreaterThan(0);
    // 원본 전체가 새 내용으로 대체됨
    const combined = updates.map((u) => u.new_content).join('\n\n');
    expect(combined).toContain('X');
    expect(combined).toContain('Y');
  });

  it('공백만 있는 원본을 빈 문서로 취급한다', () => {
    expect(buildContentUpdates('  \n\n  ', 'Hello')).toEqual([
      { old_content: '', new_content: 'Hello' },
    ]);
  });
});
