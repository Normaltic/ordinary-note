import type { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor;
}

interface ToolbarButton {
  label: string;
  action: () => void;
  isActive: boolean;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const groups: ToolbarButton[][] = [
    [
      {
        label: 'H1',
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: editor.isActive('heading', { level: 1 }),
      },
      {
        label: 'H2',
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: editor.isActive('heading', { level: 2 }),
      },
      {
        label: 'H3',
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: editor.isActive('heading', { level: 3 }),
      },
    ],
    [
      {
        label: 'Bullet',
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: editor.isActive('bulletList'),
      },
      {
        label: 'Ordered',
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: editor.isActive('orderedList'),
      },
    ],
    [
      {
        label: 'Quote',
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: editor.isActive('blockquote'),
      },
      {
        label: 'Code Block',
        action: () => editor.chain().focus().toggleCodeBlock().run(),
        isActive: editor.isActive('codeBlock'),
      },
      {
        label: 'HR',
        action: () => editor.chain().focus().setHorizontalRule().run(),
        isActive: false,
      },
    ],
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border-default pb-2">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <span className="mx-1 text-text-muted">|</span>}
          {group.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.action}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                btn.isActive
                  ? 'bg-bg-active text-text-primary'
                  : 'text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
