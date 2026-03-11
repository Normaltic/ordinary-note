import { describe, it, expect } from 'vitest';
import { simpleDiff } from './diff.js';

describe('simpleDiff', () => {
  it('동일한 내용이면 빈 배열을 반환한다', () => {
    expect(simpleDiff(['a', 'b'], ['a', 'b'])).toEqual([]);
  });

  it('변경된 줄을 -/+ 로 표시한다', () => {
    expect(simpleDiff(['hello'], ['world'])).toEqual([
      '-hello',
      '+world',
    ]);
  });

  it('추가된 줄을 + 로 표시한다', () => {
    expect(simpleDiff(['a'], ['a', 'b'])).toEqual(['+b']);
  });

  it('삭제된 줄을 - 로 표시한다', () => {
    expect(simpleDiff(['a', 'b'], ['a'])).toEqual(['-b']);
  });

  it('빈 배열 비교를 처리한다', () => {
    expect(simpleDiff([], [])).toEqual([]);
  });

  it('빈 원본에서 내용이 추가되면 모두 + 로 표시한다', () => {
    expect(simpleDiff([], ['a', 'b'])).toEqual(['+a', '+b']);
  });

  it('내용이 모두 삭제되면 모두 - 로 표시한다', () => {
    expect(simpleDiff(['a', 'b'], [])).toEqual(['-a', '-b']);
  });

  it('중간 줄 변경을 감지한다', () => {
    const result = simpleDiff(
      ['first', 'second', 'third'],
      ['first', 'changed', 'third'],
    );
    expect(result).toEqual(['-second', '+changed']);
  });

  it('여러 줄 변경을 감지한다', () => {
    const result = simpleDiff(
      ['a', 'b', 'c'],
      ['x', 'b', 'y'],
    );
    expect(result).toEqual(['-a', '+x', '-c', '+y']);
  });
});
