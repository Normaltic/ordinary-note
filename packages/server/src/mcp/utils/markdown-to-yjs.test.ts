import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { markdownToYFragment } from './markdown-to-yjs.js';

function convert(markdown: string): Y.XmlFragment {
  const doc = new Y.Doc();
  const fragment = doc.getXmlFragment('default');
  markdownToYFragment(markdown, fragment);
  return fragment;
}

function getElement(fragment: Y.XmlFragment, index: number): Y.XmlElement {
  return fragment.get(index) as Y.XmlElement;
}

function getChildElement(element: Y.XmlElement, index: number): Y.XmlElement {
  return element.get(index) as Y.XmlElement;
}

function getTextContent(element: Y.XmlElement): string {
  const text = element.get(0) as Y.XmlText;
  return text.toJSON();
}

function getTextDelta(element: Y.XmlElement): Array<{ insert: string; attributes?: Record<string, object> }> {
  const text = element.get(0) as Y.XmlText;
  return text.toDelta() as Array<{ insert: string; attributes?: Record<string, object> }>;
}

describe('markdownToYFragment', () => {
  describe('빈 입력', () => {
    it('빈 문자열 → 빈 paragraph 1개', () => {
      const fragment = convert('');
      expect(fragment.length).toBe(1);
      expect(getElement(fragment, 0).nodeName).toBe('paragraph');
    });

    it('공백만 있는 입력 → 빈 paragraph 1개', () => {
      const fragment = convert('   \n  ');
      expect(fragment.length).toBe(1);
      expect(getElement(fragment, 0).nodeName).toBe('paragraph');
    });
  });

  describe('paragraph', () => {
    it('일반 텍스트 → paragraph', () => {
      const fragment = convert('Hello world');
      expect(fragment.length).toBe(1);
      expect(getElement(fragment, 0).nodeName).toBe('paragraph');
      expect(getTextContent(getElement(fragment, 0))).toBe('Hello world');
    });

    it('여러 paragraph', () => {
      const fragment = convert('First\n\nSecond');
      expect(fragment.length).toBe(2);
      expect(getTextContent(getElement(fragment, 0))).toBe('First');
      expect(getTextContent(getElement(fragment, 1))).toBe('Second');
    });
  });

  describe('heading', () => {
    it.each([1, 2, 3])('heading level %d', (level) => {
      const fragment = convert(`${'#'.repeat(level)} Title`);
      const heading = getElement(fragment, 0);
      expect(heading.nodeName).toBe('heading');
      expect(heading.getAttribute('level')).toBe(String(level));
      expect(getTextContent(heading)).toBe('Title');
    });
  });

  describe('인라인 마크', () => {
    it('bold', () => {
      const fragment = convert('**bold text**');
      const delta = getTextDelta(getElement(fragment, 0));
      expect(delta).toEqual([
        { insert: 'bold text', attributes: { bold: {} } },
      ]);
    });

    it('italic', () => {
      const fragment = convert('*italic text*');
      const delta = getTextDelta(getElement(fragment, 0));
      expect(delta).toEqual([
        { insert: 'italic text', attributes: { italic: {} } },
      ]);
    });

    it('strikethrough', () => {
      const fragment = convert('~~strike~~');
      const delta = getTextDelta(getElement(fragment, 0));
      expect(delta).toEqual([
        { insert: 'strike', attributes: { strike: {} } },
      ]);
    });

    it('inline code', () => {
      const fragment = convert('`code`');
      const delta = getTextDelta(getElement(fragment, 0));
      expect(delta).toEqual([
        { insert: 'code', attributes: { code: {} } },
      ]);
    });

    it('link', () => {
      const fragment = convert('[link](https://example.com)');
      const delta = getTextDelta(getElement(fragment, 0));
      expect(delta).toEqual([
        { insert: 'link', attributes: { link: { href: 'https://example.com' } } },
      ]);
    });

    it('중첩 마크: bold + italic', () => {
      const fragment = convert('***bold italic***');
      const delta = getTextDelta(getElement(fragment, 0));
      expect(delta[0].insert).toBe('bold italic');
      expect(delta[0].attributes).toEqual(
        expect.objectContaining({ bold: {}, italic: {} }),
      );
    });

    it('mixed inline', () => {
      const fragment = convert('normal **bold** normal');
      const delta = getTextDelta(getElement(fragment, 0));
      expect(delta).toHaveLength(3);
      expect(delta[0]).toEqual({ insert: 'normal ' });
      expect(delta[1]).toEqual({ insert: 'bold', attributes: { bold: {} } });
      expect(delta[2]).toEqual({ insert: ' normal' });
    });
  });

  describe('code block', () => {
    it('언어 지정', () => {
      const fragment = convert('```typescript\nconst x = 1;\n```');
      const codeBlock = getElement(fragment, 0);
      expect(codeBlock.nodeName).toBe('codeBlock');
      expect(codeBlock.getAttribute('language')).toBe('typescript');
      expect(getTextContent(codeBlock)).toBe('const x = 1;');
    });

    it('언어 미지정', () => {
      const fragment = convert('```\nhello\n```');
      const codeBlock = getElement(fragment, 0);
      expect(codeBlock.nodeName).toBe('codeBlock');
      expect(codeBlock.getAttribute('language')).toBeUndefined();
    });
  });

  describe('bullet list', () => {
    it('단순 목록', () => {
      const fragment = convert('- item 1\n- item 2');
      const list = getElement(fragment, 0);
      expect(list.nodeName).toBe('bulletList');
      expect(list.length).toBe(2);

      const item1 = getChildElement(list, 0);
      expect(item1.nodeName).toBe('listItem');
      const para1 = getChildElement(item1, 0);
      expect(getTextContent(para1)).toBe('item 1');
    });
  });

  describe('ordered list', () => {
    it('단순 목록', () => {
      const fragment = convert('1. first\n2. second');
      const list = getElement(fragment, 0);
      expect(list.nodeName).toBe('orderedList');
      expect(list.length).toBe(2);
    });
  });

  describe('blockquote', () => {
    it('단순 인용', () => {
      const fragment = convert('> quoted text');
      const bq = getElement(fragment, 0);
      expect(bq.nodeName).toBe('blockquote');
      const para = getChildElement(bq, 0);
      expect(para.nodeName).toBe('paragraph');
      expect(getTextContent(para)).toBe('quoted text');
    });
  });

  describe('horizontal rule', () => {
    it('--- → horizontalRule', () => {
      const fragment = convert('---');
      expect(getElement(fragment, 0).nodeName).toBe('horizontalRule');
    });
  });

  describe('table', () => {
    it('기본 테이블', () => {
      const md = '| a | b |\n| --- | --- |\n| c | d |';
      const fragment = convert(md);
      const table = getElement(fragment, 0);
      expect(table.nodeName).toBe('table');

      const headerRow = getChildElement(table, 0);
      expect(headerRow.nodeName).toBe('tableRow');
      const th = getChildElement(headerRow, 0);
      expect(th.nodeName).toBe('tableHeader');

      const bodyRow = getChildElement(table, 1);
      const td = getChildElement(bodyRow, 0);
      expect(td.nodeName).toBe('tableCell');
    });
  });

  describe('task list', () => {
    it('체크리스트', () => {
      const fragment = convert('- [ ] todo\n- [x] done');
      const taskList = getElement(fragment, 0);
      expect(taskList.nodeName).toBe('taskList');
      expect(taskList.length).toBe(2);

      const item1 = getChildElement(taskList, 0);
      expect(item1.nodeName).toBe('taskItem');
      expect(item1.getAttribute('checked')).toBe('false');

      const item2 = getChildElement(taskList, 1);
      expect(item2.getAttribute('checked')).toBe('true');
    });
  });

  describe('복합 마크다운', () => {
    it('리스트 내 서식', () => {
      const fragment = convert('- **bold item**\n- *italic item*');
      const list = getElement(fragment, 0);
      expect(list.nodeName).toBe('bulletList');

      const item1 = getChildElement(list, 0);
      const para1 = getChildElement(item1, 0);
      const delta1 = (para1.get(0) as Y.XmlText).toDelta();
      expect(delta1[0].attributes).toEqual(expect.objectContaining({ bold: {} }));
    });

    it('heading + paragraph + list 조합', () => {
      const md = '# Title\n\nSome text\n\n- item 1\n- item 2';
      const fragment = convert(md);
      expect(fragment.length).toBe(3);
      expect(getElement(fragment, 0).nodeName).toBe('heading');
      expect(getElement(fragment, 1).nodeName).toBe('paragraph');
      expect(getElement(fragment, 2).nodeName).toBe('bulletList');
    });
  });
});
