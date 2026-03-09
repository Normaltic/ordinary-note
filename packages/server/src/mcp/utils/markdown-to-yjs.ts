import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import { XmlElement, XmlText, type XmlFragment } from 'yjs';

const md = MarkdownIt();

type MarkAttrs = Record<string, object>;



export function markdownToYFragment(
  markdown: string,
  fragment: XmlFragment,
): void {
  const trimmed = markdown.trim();
  if (!trimmed) {
    fragment.push([new XmlElement('paragraph')]);
    return;
  }

  const tokens = md.parse(trimmed, {});
  const elements = processBlockTokens(tokens);
  if (elements.length > 0) {
    fragment.push(elements);
  }
}

function processBlockTokens(
  tokens: Token[],
): Array<XmlElement> {
  const result: XmlElement[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    switch (token.type) {
      case 'paragraph_open': {
        const { element, endIndex } = processBlockPair(
          'paragraph',
          tokens,
          i,
        );
        result.push(element);
        i = endIndex + 1;
        break;
      }

      case 'heading_open': {
        const level = parseInt(token.tag.slice(1), 10);
        const { element, endIndex } = processBlockPair(
          'heading',
          tokens,
          i,
        );
        // @ts-expect-error Yjs setAttribute TS 타입은 string만 허용하지만 런타임에서 number 지원, tiptap 호환 필요
        element.setAttribute('level', level);
        result.push(element);
        i = endIndex + 1;
        break;
      }

      case 'bullet_list_open': {
        const { element, endIndex } = processListBlock(
          'bulletList',
          tokens,
          i,
        );
        result.push(element);
        i = endIndex + 1;
        break;
      }

      case 'ordered_list_open': {
        const { element, endIndex } = processListBlock(
          'orderedList',
          tokens,
          i,
        );
        result.push(element);
        i = endIndex + 1;
        break;
      }

      case 'blockquote_open': {
        const { element, endIndex } = processContainerBlock(
          'blockquote',
          'blockquote_close',
          tokens,
          i,
        );
        result.push(element);
        i = endIndex + 1;
        break;
      }

      case 'fence':
      case 'code_block': {
        const codeBlock = new XmlElement('codeBlock');
        const lang = token.info?.trim();
        if (lang) {
          codeBlock.setAttribute('language', lang);
        }
        // code_block/fence content has trailing newline — strip it
        const code = token.content.replace(/\n$/, '');
        codeBlock.insert(0, [new XmlText(code)]);
        result.push(codeBlock);
        i++;
        break;
      }

      case 'hr': {
        result.push(new XmlElement('horizontalRule'));
        i++;
        break;
      }

      case 'table_open': {
        const { element, endIndex } = processTable(tokens, i);
        result.push(element);
        i = endIndex + 1;
        break;
      }

      default:
        i++;
        break;
    }
  }

  return result;
}

/**
 * Process a simple block pair (open/inline/close) like paragraph or heading.
 */
function processBlockPair(
  nodeName: string,
  tokens: Token[],
  startIndex: number,
): { element: XmlElement; endIndex: number } {
  const element = new XmlElement(nodeName);
  let i = startIndex + 1;

  while (i < tokens.length) {
    const token = tokens[i];
    if (token.type === `${nodeName}_close` || token.type === 'heading_close' || token.type === 'paragraph_close') {
      if (token.nesting === -1 && token.tag === tokens[startIndex].tag) {
        return { element, endIndex: i };
      }
    }
    if (token.type === 'inline' && token.children) {
      const textNode = processInlineTokens(token.children);
      if (textNode) {
        element.push([textNode]);
      }
    }
    i++;
  }

  return { element, endIndex: i - 1 };
}

/**
 * Process a list block (bulletList or orderedList).
 * Detects task list items (checkbox pattern).
 */
function processListBlock(
  listType: 'bulletList' | 'orderedList',
  tokens: Token[],
  startIndex: number,
): { element: XmlElement; endIndex: number } {
  const closeType = listType === 'bulletList' ? 'bullet_list_close' : 'ordered_list_close';
  let i = startIndex + 1;
  const listItems: Array<{ element: XmlElement; isTask: boolean; checked: boolean }> = [];

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === closeType) {
      break;
    }

    if (token.type === 'list_item_open') {
      const { item, endIndex, isTask, checked } = processListItem(tokens, i);
      listItems.push({ element: item, isTask, checked });
      i = endIndex + 1;
    } else {
      i++;
    }
  }

  // Determine if this is a task list (all items are tasks)
  const allTasks = listItems.length > 0 && listItems.every((li) => li.isTask);

  if (allTasks) {
    const taskList = new XmlElement('taskList');
    for (const { element: itemEl, checked } of listItems) {
      // itemEl is already a taskItem (created directly by processListItem)
      // unchecked → 속성 미설정 (tiptap default: false)
      if (checked) {
        itemEl.setAttribute('checked', 'true');
      }
      taskList.push([itemEl]);
    }
    return { element: taskList, endIndex: i };
  }

  const listElement = new XmlElement(listType);
  for (const { element: itemEl } of listItems) {
    listElement.push([itemEl]);
  }
  return { element: listElement, endIndex: i };
}

/**
 * Process a single list item, detecting task checkbox pattern.
 */
function processListItem(
  tokens: Token[],
  startIndex: number,
): { item: XmlElement; endIndex: number; isTask: boolean; checked: boolean } {
  let i = startIndex + 1;
  let isTask = false;
  let checked = false;

  // First pass: scan for task checkbox to determine item type
  const scanIndex = findInlineInListItem(tokens, i);
  if (scanIndex !== -1 && tokens[scanIndex].children) {
    const result = detectTaskCheckbox(tokens[scanIndex].children!);
    isTask = result.taskDetected;
    checked = result.taskChecked;
  }

  // Create the appropriate element type from the start
  const item = new XmlElement(isTask ? 'taskItem' : 'listItem');

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'list_item_close') {
      return { item, endIndex: i, isTask, checked };
    }

    if (token.type === 'paragraph_open') {
      const para = new XmlElement('paragraph');
      i++;
      while (i < tokens.length && tokens[i].type !== 'paragraph_close') {
        if (tokens[i].type === 'inline' && tokens[i].children) {
          const children = tokens[i].children!;
          if (isTask) {
            // Strip checkbox prefix from inline content
            const { remainingChildren } = detectTaskCheckbox(children);
            const textNode = processInlineTokens(remainingChildren);
            if (textNode) {
              para.push([textNode]);
            }
          } else {
            const textNode = processInlineTokens(children);
            if (textNode) {
              para.push([textNode]);
            }
          }
        }
        i++;
      }
      item.push([para]);
      i++; // skip paragraph_close
      continue;
    }

    // Nested lists
    if (token.type === 'bullet_list_open') {
      const { element, endIndex } = processListBlock('bulletList', tokens, i);
      item.push([element]);
      i = endIndex + 1;
      continue;
    }

    if (token.type === 'ordered_list_open') {
      const { element, endIndex } = processListBlock('orderedList', tokens, i);
      item.push([element]);
      i = endIndex + 1;
      continue;
    }

    i++;
  }

  return { item, endIndex: i - 1, isTask, checked };
}

/**
 * Find the index of the first inline token within a list item.
 */
function findInlineInListItem(tokens: Token[], fromIndex: number): number {
  for (let i = fromIndex; i < tokens.length; i++) {
    if (tokens[i].type === 'list_item_close') return -1;
    if (tokens[i].type === 'inline') return i;
  }
  return -1;
}

/**
 * Detect task checkbox pattern at the start of inline children.
 * Matches: [ ] or [x] or [X] at the beginning of text.
 */
function detectTaskCheckbox(
  children: Token[],
): { taskDetected: boolean; taskChecked: boolean; remainingChildren: Token[] } {
  if (children.length === 0) {
    return { taskDetected: false, taskChecked: false, remainingChildren: children };
  }

  // Look for text token starting with [ ] or [x]
  const firstText = children[0];
  if (firstText.type !== 'text') {
    return { taskDetected: false, taskChecked: false, remainingChildren: children };
  }

  const match = firstText.content.match(/^\[([ xX])\]\s*/);
  if (!match) {
    return { taskDetected: false, taskChecked: false, remainingChildren: children };
  }

  const taskChecked = match[1].toLowerCase() === 'x';
  const remaining = firstText.content.slice(match[0].length);

  const remainingChildren = [...children];
  if (remaining) {
    const newToken = new (firstText.constructor as { new (type: string, tag: string, nesting: number): Token })(
      'text', '', 0,
    );
    newToken.content = remaining;
    remainingChildren[0] = newToken;
  } else {
    remainingChildren.shift();
  }

  return { taskDetected: true, taskChecked, remainingChildren };
}

/**
 * Process a container block that can contain other blocks (e.g., blockquote).
 */
function processContainerBlock(
  nodeName: string,
  closeType: string,
  tokens: Token[],
  startIndex: number,
): { element: XmlElement; endIndex: number } {
  const element = new XmlElement(nodeName);
  let i = startIndex + 1;

  // Collect tokens between open and close
  const innerTokens: Token[] = [];
  let depth = 1;

  while (i < tokens.length) {
    const token = tokens[i];
    if (token.type === `${nodeName}_open`) {
      depth++;
    } else if (token.type === closeType) {
      depth--;
      if (depth === 0) {
        break;
      }
    }
    innerTokens.push(token);
    i++;
  }

  const innerElements = processBlockTokens(innerTokens);
  if (innerElements.length > 0) {
    element.push(innerElements);
  }

  return { element, endIndex: i };
}

/**
 * Process a markdown table into Yjs XmlElements.
 */
function processTable(
  tokens: Token[],
  startIndex: number,
): { element: XmlElement; endIndex: number } {
  const table = new XmlElement('table');
  let i = startIndex + 1;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'table_close') {
      break;
    }

    // Skip thead_open/close and tbody_open/close
    if (
      token.type === 'thead_open' ||
      token.type === 'thead_close' ||
      token.type === 'tbody_open' ||
      token.type === 'tbody_close'
    ) {
      i++;
      continue;
    }

    if (token.type === 'tr_open') {
      const { row, endIndex } = processTableRow(tokens, i);
      table.push([row]);
      i = endIndex + 1;
      continue;
    }

    i++;
  }

  return { element: table, endIndex: i };
}

function processTableRow(
  tokens: Token[],
  startIndex: number,
): { row: XmlElement; endIndex: number } {
  const row = new XmlElement('tableRow');
  let i = startIndex + 1;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'tr_close') {
      return { row, endIndex: i };
    }

    if (token.type === 'th_open' || token.type === 'td_open') {
      const cellType = token.type === 'th_open' ? 'tableHeader' : 'tableCell';
      const closeType = token.type === 'th_open' ? 'th_close' : 'td_close';
      const cell = new XmlElement(cellType);
      const cellParagraph = new XmlElement('paragraph');
      i++;

      while (i < tokens.length && tokens[i].type !== closeType) {
        if (tokens[i].type === 'inline' && tokens[i].children) {
          const textNode = processInlineTokens(tokens[i].children!);
          if (textNode) {
            cellParagraph.push([textNode]);
          }
        }
        i++;
      }

      cell.push([cellParagraph]);
      row.push([cell]);
      i++; // skip close
      continue;
    }

    i++;
  }

  return { row, endIndex: i - 1 };
}

/**
 * Process inline tokens into a single XmlText with marks.
 */
function processInlineTokens(children: Token[]): XmlText | null {
  const text = new XmlText();
  let offset = 0;
  const markStack: MarkAttrs[] = [{}];

  for (const child of children) {
    switch (child.type) {
      case 'text': {
        const marks = currentMarks(markStack);
        text.insert(offset, child.content, marks);
        offset += child.content.length;
        break;
      }

      case 'code_inline': {
        const marks = { ...currentMarks(markStack), code: {} };
        text.insert(offset, child.content, marks);
        offset += child.content.length;
        break;
      }

      case 'strong_open': {
        pushMark(markStack, 'bold', {});
        break;
      }
      case 'strong_close': {
        popMark(markStack, 'bold');
        break;
      }

      case 'em_open': {
        pushMark(markStack, 'italic', {});
        break;
      }
      case 'em_close': {
        popMark(markStack, 'italic');
        break;
      }

      case 's_open': {
        pushMark(markStack, 'strike', {});
        break;
      }
      case 's_close': {
        popMark(markStack, 'strike');
        break;
      }

      case 'link_open': {
        const href = child.attrGet('href') ?? '';
        pushMark(markStack, 'link', { href });
        break;
      }
      case 'link_close': {
        popMark(markStack, 'link');
        break;
      }

      case 'softbreak':
        break;

      default:
        break;
    }
  }

  return offset > 0 ? text : null;
}

function currentMarks(stack: MarkAttrs[]): MarkAttrs {
  return stack[stack.length - 1];
}

function pushMark(stack: MarkAttrs[], name: string, attrs: object): void {
  stack.push({ ...currentMarks(stack), [name]: attrs });
}

function popMark(stack: MarkAttrs[], name: string): void {
  const current = { ...currentMarks(stack) };
  delete current[name];
  stack.push(current);
}
