import { describe, it, expect } from 'vitest';
import { Doc, XmlElement, XmlText, XmlFragment } from 'yjs';
import { applyContentUpdates } from './content-updater.js';
import { yFragmentToMarkdown } from './yjs-to-markdown.js';
import { markdownToYFragment } from './markdown-to-yjs.js';

function createFragmentWithMarkdown(markdown: string): XmlFragment {
  const doc = new Doc();
  const fragment = doc.getXmlFragment('default');
  markdownToYFragment(markdown, fragment);
  return fragment;
}

function createEmptyFragment(): XmlFragment {
  const doc = new Doc();
  const fragment = doc.getXmlFragment('default');
  fragment.push([new XmlElement('paragraph')]);
  return fragment;
}

describe('applyContentUpdates', () => {
  it('단일 블록 내 텍스트를 수정한다', () => {
    const fragment = createFragmentWithMarkdown('Hello world');
    applyContentUpdates(fragment, [
      { old_content: 'Hello world', new_content: 'Hello universe' },
    ]);
    expect(yFragmentToMarkdown(fragment)).toBe('Hello universe');
  });

  it('heading 블록을 교체한다', () => {
    const fragment = createFragmentWithMarkdown('# Title\n\nBody text');
    applyContentUpdates(fragment, [
      { old_content: '# Title', new_content: '## New Title' },
    ]);
    expect(yFragmentToMarkdown(fragment)).toBe('## New Title\n\nBody text');
  });

  it('여러 블록에 걸친 범위를 수정한다', () => {
    const fragment = createFragmentWithMarkdown(
      '# Title\n\nFirst paragraph\n\nSecond paragraph',
    );
    applyContentUpdates(fragment, [
      {
        old_content: 'First paragraph\n\nSecond paragraph',
        new_content: 'Merged paragraph',
      },
    ]);
    expect(yFragmentToMarkdown(fragment)).toBe('# Title\n\nMerged paragraph');
  });

  it('블록을 삽입한다 (new_content가 더 긴 경우)', () => {
    const fragment = createFragmentWithMarkdown('# Title\n\nBody');
    applyContentUpdates(fragment, [
      {
        old_content: 'Body',
        new_content: 'Body\n\nNew paragraph\n\nAnother one',
      },
    ]);
    expect(yFragmentToMarkdown(fragment)).toBe(
      '# Title\n\nBody\n\nNew paragraph\n\nAnother one',
    );
  });

  it('블록을 삭제한다 (new_content = "")', () => {
    const fragment = createFragmentWithMarkdown(
      '# Title\n\nTo delete\n\nKeep this',
    );
    applyContentUpdates(fragment, [
      { old_content: 'To delete', new_content: '' },
    ]);
    expect(yFragmentToMarkdown(fragment)).toBe('# Title\n\nKeep this');
  });

  it('빈 paragraph가 있는 문서에 최초 작성한다 (old_content = "")', () => {
    const fragment = createEmptyFragment();
    applyContentUpdates(fragment, [
      { old_content: '', new_content: '# Hello\n\nNew content' },
    ]);
    expect(yFragmentToMarkdown(fragment)).toBe('# Hello\n\nNew content');
  });

  it('fragment가 비어있는 문서에 최초 작성한다 (old_content = "")', () => {
    const doc = new Doc();
    const fragment = doc.getXmlFragment('default');
    // fragment.length === 0, 블록이 전혀 없는 상태
    applyContentUpdates(fragment, [
      { old_content: '', new_content: '# Hello\n\nNew content' },
    ]);
    expect(yFragmentToMarkdown(fragment)).toBe('# Hello\n\nNew content');
  });

  it('여러 content_updates를 동시에 적용한다', () => {
    const fragment = createFragmentWithMarkdown(
      '# Title\n\nFirst\n\nSecond\n\nThird',
    );
    applyContentUpdates(fragment, [
      { old_content: 'First', new_content: 'First updated' },
      { old_content: 'Third', new_content: 'Third updated' },
    ]);
    expect(yFragmentToMarkdown(fragment)).toBe(
      '# Title\n\nFirst updated\n\nSecond\n\nThird updated',
    );
  });

  it('빈 updates 배열이면 아무 작업도 하지 않는다', () => {
    const fragment = createFragmentWithMarkdown('Hello');
    applyContentUpdates(fragment, []);
    expect(yFragmentToMarkdown(fragment)).toBe('Hello');
  });

  it('블록 내 부분 텍스트를 수정한다', () => {
    const fragment = createFragmentWithMarkdown(
      'The quick brown fox jumps over the lazy dog',
    );
    applyContentUpdates(fragment, [
      { old_content: 'brown fox', new_content: 'red cat' },
    ]);
    expect(yFragmentToMarkdown(fragment)).toBe(
      'The quick red cat jumps over the lazy dog',
    );
  });

  describe('에러 케이스', () => {
    it('old_content 매칭 실패 시 에러를 던진다', () => {
      const fragment = createFragmentWithMarkdown('Hello world');
      expect(() =>
        applyContentUpdates(fragment, [
          { old_content: 'nonexistent', new_content: 'replacement' },
        ]),
      ).toThrow('old_content를 찾을 수 없습니다');
    });

    it('old_content 중복 매칭 시 에러를 던진다', () => {
      const fragment = createFragmentWithMarkdown('hello\n\nhello');
      expect(() =>
        applyContentUpdates(fragment, [
          { old_content: 'hello', new_content: 'world' },
        ]),
      ).toThrow('old_content가 여러 곳에서 발견됩니다');
    });

    it('여러 update의 블록 범위가 겹치면 에러를 던진다', () => {
      const fragment = createFragmentWithMarkdown(
        'First line\n\nSecond line\n\nThird line',
      );
      expect(() =>
        applyContentUpdates(fragment, [
          {
            old_content: 'First line\n\nSecond line',
            new_content: 'replaced',
          },
          { old_content: 'Second line\n\nThird line', new_content: 'replaced' },
        ]),
      ).toThrow('블록 범위가 겹칩니다');
    });

    it('빈 old_content이지만 문서가 비어있지 않으면 에러를 던진다', () => {
      const fragment = createFragmentWithMarkdown('Some content');
      expect(() =>
        applyContentUpdates(fragment, [
          { old_content: '', new_content: 'new stuff' },
        ]),
      ).toThrow('문서가 비어있지 않습니다');
    });
  });
});
