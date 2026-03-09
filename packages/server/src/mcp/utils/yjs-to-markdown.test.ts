import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { yFragmentToMarkdown } from './yjs-to-markdown.js';

function createFragment(): { doc: Y.Doc; fragment: Y.XmlFragment } {
  const doc = new Y.Doc();
  const fragment = doc.getXmlFragment('default');
  return { doc, fragment };
}

function paragraph(text: string): Y.XmlElement {
  const el = new Y.XmlElement('paragraph');
  if (text) {
    el.insert(0, [new Y.XmlText(text)]);
  }
  return el;
}

function heading(text: string, level: number): Y.XmlElement {
  const el = new Y.XmlElement('heading');
  el.setAttribute('level', String(level));
  el.insert(0, [new Y.XmlText(text)]);
  return el;
}

function textWithMarks(
  segments: Array<{ text: string; marks?: Record<string, object> }>,
): Y.XmlText {
  const xmlText = new Y.XmlText();
  let offset = 0;
  for (const seg of segments) {
    // Always pass an object to prevent mark inheritance from adjacent text
    xmlText.insert(offset, seg.text, seg.marks ?? {});
    offset += seg.text.length;
  }
  return xmlText;
}

describe('yFragmentToMarkdown', () => {
  describe('빈 fragment', () => {
    it('빈 fragment → 빈 문자열', () => {
      const { fragment } = createFragment();
      expect(yFragmentToMarkdown(fragment)).toBe('');
    });
  });

  describe('paragraph', () => {
    it('단일 paragraph', () => {
      const { fragment } = createFragment();
      fragment.push([paragraph('Hello world')]);
      expect(yFragmentToMarkdown(fragment)).toBe('Hello world');
    });

    it('여러 paragraph', () => {
      const { fragment } = createFragment();
      fragment.push([paragraph('First'), paragraph('Second')]);
      expect(yFragmentToMarkdown(fragment)).toBe('First\n\nSecond');
    });
  });

  describe('heading', () => {
    it.each([1, 2, 3])('heading level %d', (level) => {
      const { fragment } = createFragment();
      fragment.push([heading('Title', level)]);
      expect(yFragmentToMarkdown(fragment)).toBe(`${'#'.repeat(level)} Title`);
    });
  });

  describe('인라인 마크', () => {
    it('bold', () => {
      const { fragment } = createFragment();
      const para = new Y.XmlElement('paragraph');
      para.insert(0, [textWithMarks([{ text: 'bold', marks: { bold: {} } }])]);
      fragment.push([para]);
      expect(yFragmentToMarkdown(fragment)).toBe('**bold**');
    });

    it('italic', () => {
      const { fragment } = createFragment();
      const para = new Y.XmlElement('paragraph');
      para.insert(0, [textWithMarks([{ text: 'italic', marks: { italic: {} } }])]);
      fragment.push([para]);
      expect(yFragmentToMarkdown(fragment)).toBe('*italic*');
    });

    it('strikethrough', () => {
      const { fragment } = createFragment();
      const para = new Y.XmlElement('paragraph');
      para.insert(0, [textWithMarks([{ text: 'strike', marks: { strike: {} } }])]);
      fragment.push([para]);
      expect(yFragmentToMarkdown(fragment)).toBe('~~strike~~');
    });

    it('inline code', () => {
      const { fragment } = createFragment();
      const para = new Y.XmlElement('paragraph');
      para.insert(0, [textWithMarks([{ text: 'code', marks: { code: {} } }])]);
      fragment.push([para]);
      expect(yFragmentToMarkdown(fragment)).toBe('`code`');
    });

    it('link', () => {
      const { fragment } = createFragment();
      const para = new Y.XmlElement('paragraph');
      para.insert(0, [textWithMarks([{ text: 'link', marks: { link: { href: 'https://example.com' } } }])]);
      fragment.push([para]);
      expect(yFragmentToMarkdown(fragment)).toBe('[link](https://example.com)');
    });

    it('mixed inline', () => {
      const { fragment } = createFragment();
      const para = new Y.XmlElement('paragraph');
      para.insert(0, [textWithMarks([
        { text: 'normal ' },
        { text: 'bold', marks: { bold: {} } },
        { text: ' normal' },
      ])]);
      fragment.push([para]);
      expect(yFragmentToMarkdown(fragment)).toBe('normal **bold** normal');
    });
  });

  describe('code block', () => {
    it('언어 지정', () => {
      const { fragment } = createFragment();
      const cb = new Y.XmlElement('codeBlock');
      cb.setAttribute('language', 'typescript');
      cb.insert(0, [new Y.XmlText('const x = 1;')]);
      fragment.push([cb]);
      expect(yFragmentToMarkdown(fragment)).toBe('```typescript\nconst x = 1;\n```');
    });

    it('언어 미지정', () => {
      const { fragment } = createFragment();
      const cb = new Y.XmlElement('codeBlock');
      cb.insert(0, [new Y.XmlText('hello')]);
      fragment.push([cb]);
      expect(yFragmentToMarkdown(fragment)).toBe('```\nhello\n```');
    });
  });

  describe('bullet list', () => {
    it('단순 목록', () => {
      const { fragment } = createFragment();
      const list = new Y.XmlElement('bulletList');
      const item1 = new Y.XmlElement('listItem');
      item1.push([paragraph('item 1')]);
      const item2 = new Y.XmlElement('listItem');
      item2.push([paragraph('item 2')]);
      list.push([item1, item2]);
      fragment.push([list]);
      expect(yFragmentToMarkdown(fragment)).toBe('- item 1\n- item 2');
    });
  });

  describe('ordered list', () => {
    it('단순 목록', () => {
      const { fragment } = createFragment();
      const list = new Y.XmlElement('orderedList');
      const item1 = new Y.XmlElement('listItem');
      item1.push([paragraph('first')]);
      const item2 = new Y.XmlElement('listItem');
      item2.push([paragraph('second')]);
      list.push([item1, item2]);
      fragment.push([list]);
      expect(yFragmentToMarkdown(fragment)).toBe('1. first\n2. second');
    });
  });

  describe('blockquote', () => {
    it('단순 인용', () => {
      const { fragment } = createFragment();
      const bq = new Y.XmlElement('blockquote');
      bq.push([paragraph('quoted text')]);
      fragment.push([bq]);
      expect(yFragmentToMarkdown(fragment)).toBe('> quoted text');
    });
  });

  describe('horizontal rule', () => {
    it('horizontalRule → ---', () => {
      const { fragment } = createFragment();
      fragment.push([new Y.XmlElement('horizontalRule')]);
      expect(yFragmentToMarkdown(fragment)).toBe('---');
    });
  });

  describe('table', () => {
    it('기본 테이블', () => {
      const { fragment } = createFragment();
      const table = new Y.XmlElement('table');

      const headerRow = new Y.XmlElement('tableRow');
      const th1 = new Y.XmlElement('tableHeader');
      th1.push([paragraph('a')]);
      const th2 = new Y.XmlElement('tableHeader');
      th2.push([paragraph('b')]);
      headerRow.push([th1, th2]);

      const bodyRow = new Y.XmlElement('tableRow');
      const td1 = new Y.XmlElement('tableCell');
      td1.push([paragraph('c')]);
      const td2 = new Y.XmlElement('tableCell');
      td2.push([paragraph('d')]);
      bodyRow.push([td1, td2]);

      table.push([headerRow, bodyRow]);
      fragment.push([table]);

      expect(yFragmentToMarkdown(fragment)).toBe(
        '| a | b |\n| --- | --- |\n| c | d |',
      );
    });
  });

  describe('task list', () => {
    it('체크리스트', () => {
      const { fragment } = createFragment();
      const taskList = new Y.XmlElement('taskList');

      const task1 = new Y.XmlElement('taskItem');
      task1.setAttribute('checked', 'false');
      task1.push([paragraph('todo')]);

      const task2 = new Y.XmlElement('taskItem');
      task2.setAttribute('checked', 'true');
      task2.push([paragraph('done')]);

      taskList.push([task1, task2]);
      fragment.push([taskList]);

      expect(yFragmentToMarkdown(fragment)).toBe('- [ ] todo\n- [x] done');
    });
  });

  describe('복합 마크다운', () => {
    it('heading + paragraph + list 조합', () => {
      const { fragment } = createFragment();
      fragment.push([
        heading('Title', 1),
        paragraph('Some text'),
        (() => {
          const list = new Y.XmlElement('bulletList');
          const item1 = new Y.XmlElement('listItem');
          item1.push([paragraph('item 1')]);
          const item2 = new Y.XmlElement('listItem');
          item2.push([paragraph('item 2')]);
          list.push([item1, item2]);
          return list;
        })(),
      ]);

      expect(yFragmentToMarkdown(fragment)).toBe(
        '# Title\n\nSome text\n\n- item 1\n- item 2',
      );
    });
  });
});
