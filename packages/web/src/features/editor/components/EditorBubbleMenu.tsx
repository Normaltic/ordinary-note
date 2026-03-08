import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';

interface EditorBubbleMenuProps {
  editor: Editor;
}

const bubbleButtons = [
  { label: 'B', mark: 'bold', toggle: 'toggleBold', className: 'font-bold' },
  { label: 'I', mark: 'italic', toggle: 'toggleItalic', className: 'italic' },
  { label: 'S', mark: 'strike', toggle: 'toggleStrike', className: 'line-through' },
  { label: 'Code', mark: 'code', toggle: 'toggleCode', className: 'font-mono text-[10px]' },
  { label: 'Link', mark: 'link', toggle: 'link', className: 'underline' },
] as const;

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const handleAction = (btn: (typeof bubbleButtons)[number]) => {
    if (btn.toggle === 'link') {
      if (editor.isActive('link')) {
        editor.chain().focus().unsetLink().run();
        return;
      }
      const url = window.prompt('URL을 입력하세요:');
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
      return;
    }
    editor.chain().focus()[btn.toggle]().run();
  };

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 rounded-lg border border-border-default bg-bg-card px-1 py-1 shadow-md"
    >
      {bubbleButtons.map((btn) => (
        <button
          key={btn.label}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleAction(btn);
          }}
          className={`rounded px-2 py-1 text-xs transition-colors ${btn.className} ${
            editor.isActive(btn.mark)
              ? 'bg-bg-active text-text-primary'
              : 'text-text-secondary hover:bg-bg-hover'
          }`}
        >
          {btn.label}
        </button>
      ))}
    </BubbleMenu>
  );
}
