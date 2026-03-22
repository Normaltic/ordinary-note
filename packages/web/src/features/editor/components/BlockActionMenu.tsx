import { useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';

interface BlockActionMenuProps {
  editor: Editor;
  pos: number;
  anchorRect: DOMRect;
  onClose: () => void;
}

interface TurnIntoItem {
  label: string;
  type: string;
  level?: number;
}

const turnIntoItems: TurnIntoItem[] = [
  { label: '텍스트', type: 'paragraph' },
  { label: '제목 1', type: 'heading', level: 1 },
  { label: '제목 2', type: 'heading', level: 2 },
  { label: '제목 3', type: 'heading', level: 3 },
  { label: '글머리 목록', type: 'bulletList' },
  { label: '번호 목록', type: 'orderedList' },
  { label: '체크리스트', type: 'taskList' },
  { label: '인용', type: 'blockquote' },
  { label: '코드 블록', type: 'codeBlock' },
];

const itemClass =
  'w-full cursor-pointer rounded-md px-2.5 py-1.5 text-left text-[0.8125rem] font-medium transition-colors hover:bg-bg-hover';

function applyTurnInto(editor: Editor, pos: number, item: TurnIntoItem) {
  const chain = editor.chain().focus().setTextSelection(pos + 1);

  switch (item.type) {
    case 'paragraph':
      chain.setParagraph().run();
      break;
    case 'heading':
      chain.setHeading({ level: item.level as 1 | 2 | 3 }).run();
      break;
    case 'bulletList':
      chain.toggleBulletList().run();
      break;
    case 'orderedList':
      chain.toggleOrderedList().run();
      break;
    case 'taskList':
      chain.toggleTaskList().run();
      break;
    case 'blockquote':
      chain.toggleBlockquote().run();
      break;
    case 'codeBlock':
      chain.toggleCodeBlock().run();
      break;
  }
}

export function BlockActionMenu({ editor, pos, anchorRect, onClose }: BlockActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const node = editor.state.doc.nodeAt(pos);
  if (!node) return null;

  const nodeType = node.type.name;
  const nodeLevel = node.attrs?.level;

  const isActive = (item: TurnIntoItem) => {
    if (item.type === 'heading') return nodeType === 'heading' && nodeLevel === item.level;
    return nodeType === item.type;
  };

  const exec = useCallback(
    (fn: () => void) => {
      fn();
      onClose();
    },
    [onClose],
  );

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[var(--z-index-overlay)] flex max-h-[360px] min-w-40 flex-col overflow-y-auto rounded-lg border border-border-default bg-bg-card p-1.5 shadow-md"
      style={{ top: anchorRect.bottom + 4, left: anchorRect.left }}
    >
      <button
        type="button"
        className={`${itemClass} text-danger hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)]`}
        onClick={() =>
          exec(() =>
            editor
              .chain()
              .focus()
              .deleteRange({ from: pos, to: pos + node.nodeSize })
              .run(),
          )
        }
      >
        삭제
      </button>
      <button
        type="button"
        className={`${itemClass} text-text-primary`}
        onClick={() =>
          exec(() =>
            editor
              .chain()
              .focus()
              .insertContentAt(pos + node.nodeSize, node.toJSON())
              .run(),
          )
        }
      >
        복제
      </button>

      <div className="mx-2 my-1 h-px bg-border-default" />
      <div className="px-2.5 pt-1.5 pb-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">
        변환
      </div>

      {turnIntoItems.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`${itemClass} ${isActive(item) ? 'text-accent' : 'text-text-primary'}`}
          onClick={() => exec(() => applyTurnInto(editor, pos, item))}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
