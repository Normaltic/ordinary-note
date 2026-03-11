import { XmlElement, XmlText, type XmlFragment } from 'yjs';

export function yFragmentToMarkdown(fragment: XmlFragment): string {
  const blocks: string[] = [];

  for (const child of fragment.toArray()) {
    if (child instanceof XmlElement) {
      const md = blockToMarkdown(child, 0);
      if (md !== null) {
        blocks.push(md);
      }
    }
  }

  return blocks.join('\n\n');
}

export function blockToMarkdown(
  element: XmlElement,
  depth: number,
): string | null {
  const name = element.nodeName;

  switch (name) {
    case 'paragraph':
      return inlineContent(element);

    case 'heading': {
      const level = parseInt(element.getAttribute('level') ?? '1', 10);
      const prefix = '#'.repeat(Math.min(level, 6));
      return `${prefix} ${inlineContent(element)}`;
    }

    case 'bulletList':
      return listToMarkdown(element, 'bullet', depth);

    case 'orderedList':
      return listToMarkdown(element, 'ordered', depth);

    case 'taskList':
      return taskListToMarkdown(element, depth);

    case 'blockquote':
      return blockquoteToMarkdown(element);

    case 'codeBlock':
      return codeBlockToMarkdown(element);

    case 'horizontalRule':
      return '---';

    case 'table':
      return tableToMarkdown(element);

    default:
      return inlineContent(element) || null;
  }
}

function inlineContent(element: XmlElement): string {
  const parts: string[] = [];

  for (const child of element.toArray()) {
    if (child instanceof XmlText) {
      parts.push(deltaToMarkdown(child));
    } else if (child instanceof XmlElement) {
      parts.push(inlineContent(child));
    }
  }

  return parts.join('');
}

/**
 * Convert XmlText delta to markdown string with marks.
 * Mark wrapping order: link > bold > italic > strike > code
 */
function deltaToMarkdown(text: XmlText): string {
  const delta = text.toDelta();
  const parts: string[] = [];

  for (const op of delta) {
    if (typeof op.insert !== 'string') continue;

    const attrs = (op.attributes ?? {}) as Record<string, Record<string, string>>;
    let result = op.insert;

    // Apply marks from inner to outer
    if (attrs.code) {
      result = `\`${result}\``;
    }
    if (attrs.strike) {
      result = `~~${result}~~`;
    }
    if (attrs.italic) {
      result = `*${result}*`;
    }
    if (attrs.bold) {
      result = `**${result}**`;
    }
    if (attrs.link) {
      result = `[${result}](${attrs.link.href})`;
    }

    parts.push(result);
  }

  return parts.join('');
}

function listToMarkdown(
  element: XmlElement,
  type: 'bullet' | 'ordered',
  depth: number,
): string {
  const lines: string[] = [];
  const indent = '  '.repeat(depth);
  let counter = 1;

  for (const child of element.toArray()) {
    if (!(child instanceof XmlElement) || child.nodeName !== 'listItem') continue;

    const prefix = type === 'bullet' ? '- ' : `${counter}. `;
    const itemLines = listItemToMarkdown(child, depth);

    if (itemLines.length > 0) {
      lines.push(`${indent}${prefix}${itemLines[0]}`);
      for (let j = 1; j < itemLines.length; j++) {
        lines.push(itemLines[j]);
      }
    } else {
      lines.push(`${indent}${prefix}`);
    }

    counter++;
  }

  return lines.join('\n');
}

function listItemToMarkdown(
  element: XmlElement,
  depth: number,
): string[] {
  const lines: string[] = [];

  for (const child of element.toArray()) {
    if (!(child instanceof XmlElement)) continue;

    if (child.nodeName === 'paragraph') {
      lines.push(inlineContent(child));
    } else if (child.nodeName === 'bulletList') {
      lines.push(listToMarkdown(child, 'bullet', depth + 1));
    } else if (child.nodeName === 'orderedList') {
      lines.push(listToMarkdown(child, 'ordered', depth + 1));
    }
  }

  return lines;
}

function taskListToMarkdown(element: XmlElement, depth: number): string {
  const lines: string[] = [];
  const indent = '  '.repeat(depth);

  for (const child of element.toArray()) {
    if (!(child instanceof XmlElement) || child.nodeName !== 'taskItem') continue;

    const checked = !!child.getAttribute('checked');
    const checkbox = checked ? '[x]' : '[ ]';
    const content = taskItemContent(child);
    lines.push(`${indent}- ${checkbox} ${content}`);
  }

  return lines.join('\n');
}

function taskItemContent(element: XmlElement): string {
  const parts: string[] = [];

  for (const child of element.toArray()) {
    if (child instanceof XmlText) {
      parts.push(deltaToMarkdown(child));
    } else if (child instanceof XmlElement) {
      if (child.nodeName === 'paragraph') {
        parts.push(inlineContent(child));
      }
    }
  }

  return parts.join('');
}

function blockquoteToMarkdown(element: XmlElement): string {
  const innerBlocks: string[] = [];

  for (const child of element.toArray()) {
    if (child instanceof XmlElement) {
      const md = blockToMarkdown(child, 0);
      if (md !== null) {
        innerBlocks.push(md);
      }
    }
  }

  return innerBlocks
    .join('\n\n')
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

function codeBlockToMarkdown(element: XmlElement): string {
  const language = element.getAttribute('language') ?? '';
  let code = '';

  for (const child of element.toArray()) {
    if (child instanceof XmlText) {
      code += child.toJSON();
    }
  }

  return `\`\`\`${language}\n${code}\n\`\`\``;
}

function tableToMarkdown(element: XmlElement): string {
  const rows: string[][] = [];
  let isFirstRow = true;
  let headerSeparator = '';

  for (const child of element.toArray()) {
    if (!(child instanceof XmlElement) || child.nodeName !== 'tableRow') continue;

    const cells: string[] = [];
    for (const cell of child.toArray()) {
      if (!(cell instanceof XmlElement)) continue;
      if (cell.nodeName === 'tableHeader' || cell.nodeName === 'tableCell') {
        cells.push(inlineContent(cell));
      }
    }

    rows.push(cells);

    if (isFirstRow) {
      headerSeparator = cells.map(() => '---').join(' | ');
      isFirstRow = false;
    }
  }

  if (rows.length === 0) return '';

  const lines: string[] = [];
  lines.push(`| ${rows[0].join(' | ')} |`);
  lines.push(`| ${headerSeparator} |`);

  for (let i = 1; i < rows.length; i++) {
    lines.push(`| ${rows[i].join(' | ')} |`);
  }

  return lines.join('\n');
}
