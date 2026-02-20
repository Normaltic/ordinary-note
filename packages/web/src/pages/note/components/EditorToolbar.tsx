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
        label: 'B',
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: editor.isActive('bold'),
      },
      {
        label: 'I',
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: editor.isActive('italic'),
      },
      {
        label: 'S',
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: editor.isActive('strike'),
      },
      {
        label: 'Code',
        action: () => editor.chain().focus().toggleCode().run(),
        isActive: editor.isActive('code'),
      },
    ],
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
    [
      {
        label: 'Link',
        action: () => {
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          const url = window.prompt('URL을 입력하세요:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        },
        isActive: editor.isActive('link'),
      },
    ],
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 pb-2">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <span className="mx-1 text-gray-300">|</span>}
          {group.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.action}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                btn.isActive
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100'
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
