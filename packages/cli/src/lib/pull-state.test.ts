import { describe, it, expect } from 'vitest';
import { sanitizeTitle, getPullPaths } from './pull-state.js';

describe('sanitizeTitle', () => {
  it('일반 제목을 그대로 반환한다', () => {
    expect(sanitizeTitle('My Note')).toBe('My_Note');
  });

  it('금지 문자를 제거한다', () => {
    expect(sanitizeTitle('a<b>c:d"e')).toBe('abcde');
  });

  it('연속 공백을 단일 _로 변환한다', () => {
    expect(sanitizeTitle('hello   world')).toBe('hello_world');
  });

  it('50자로 잘린다', () => {
    const long = 'a'.repeat(60);
    expect(sanitizeTitle(long)).toHaveLength(50);
  });

  it('빈 문자열이면 untitled을 반환한다', () => {
    expect(sanitizeTitle('')).toBe('untitled');
    expect(sanitizeTitle('   ')).toBe('untitled');
  });

  it('금지 문자만으로 이루어진 제목은 untitled을 반환한다', () => {
    expect(sanitizeTitle(':<>')).toBe('untitled');
  });

  it('끝의 언더스코어를 제거한다', () => {
    expect(sanitizeTitle('hello ')).toBe('hello');
  });

  it('한글 제목을 처리한다', () => {
    expect(sanitizeTitle('내 메모')).toBe('내_메모');
  });
});

describe('getPullPaths', () => {
  it('title이 주어지면 sanitize된 파일명을 생성한다', () => {
    const paths = getPullPaths('abc123', 'My Note');
    expect(paths.md).toContain('My_Note_abc123.md');
    expect(paths.orig).toContain('My_Note_abc123.orig.md');
    expect(paths.meta).toContain('abc123.meta.json');
  });

  it('title이 없으면 untitled prefix를 사용한다', () => {
    const paths = getPullPaths('abc123');
    expect(paths.md).toContain('untitled_abc123.md');
  });

  it('빈 title이면 untitled prefix를 사용한다', () => {
    const paths = getPullPaths('abc123', '');
    expect(paths.md).toContain('untitled_abc123.md');
  });

  it('meta 파일은 항상 noteId 기반이다', () => {
    const paths1 = getPullPaths('abc123', 'Title A');
    const paths2 = getPullPaths('abc123', 'Title B');
    expect(paths1.meta).toBe(paths2.meta);
  });
});
