import { useRef, useEffect, useCallback } from 'react';
import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/react';

interface TableMenuProps {
  editor: Editor;
}

const menuItems = [
  { label: '열 앞에 추가', command: 'addColumnBefore' as const },
  { label: '열 뒤에 추가', command: 'addColumnAfter' as const },
  { label: '열 삭제', command: 'deleteColumn' as const },
  { label: '행 위에 추가', command: 'addRowBefore' as const },
  { label: '행 아래 추가', command: 'addRowAfter' as const },
  { label: '행 삭제', command: 'deleteRow' as const },
  { label: '테이블 삭제', command: 'deleteTable' as const },
];

export function TableMenu({ editor }: TableMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const isInTable = useEditorState({
    editor,
    selector: (ctx) => ctx.editor.isActive('table'),
  });

  const updatePosition = useCallback(() => {
    if (!isInTable || !menuRef.current) return;

    const { $from } = editor.state.selection;
    let depth = $from.depth;
    while (depth > 0 && $from.node(depth).type.name !== 'table') {
      depth--;
    }
    if (depth === 0) return;

    const dom = editor.view.nodeDOM($from.before(depth));
    if (!dom || !(dom instanceof HTMLElement)) return;

    const wrapper = dom.closest('.tableWrapper') as HTMLElement | null;
    const target = wrapper || dom;

    menuRef.current.style.top = `${target.offsetTop - menuRef.current.offsetHeight - 4}px`;
    menuRef.current.style.left = `${target.offsetLeft}px`;
  }, [isInTable, editor]);

  useEffect(() => {
    updatePosition();
  }, [updatePosition]);

  if (!isInTable) return null;

  return (
    <div ref={menuRef} className="table-menu absolute">
      {menuItems.map((item) => (
        <button
          key={item.command}
          type="button"
          onClick={() => editor.chain().focus()[item.command]().run()}
          className="table-menu-btn"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
