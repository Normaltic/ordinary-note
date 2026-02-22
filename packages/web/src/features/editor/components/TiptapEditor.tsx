import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { EditorToolbar } from './EditorToolbar';

interface TiptapEditorProps {
  initialContent: string;
  onUpdate: (html: string, plainText: string) => void;
}

export function TiptapEditor({ initialContent, onUpdate }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
      Link.configure({ openOnClick: false }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML(), editor.getText());
    },
  });

  if (!editor) return null;

  const bubbleButtons = [
    {
      label: 'B',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      className: 'font-bold',
    },
    {
      label: 'I',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      className: 'italic',
    },
    {
      label: 'S',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike'),
      className: 'line-through',
    },
    {
      label: 'Code',
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive('code'),
      className: 'font-mono text-[10px]',
    },
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
      className: 'underline',
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <EditorToolbar editor={editor} />

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
              btn.action();
            }}
            className={`rounded px-2 py-1 text-xs transition-colors ${btn.className} ${
              btn.isActive
                ? 'bg-bg-active text-text-primary'
                : 'text-text-secondary hover:bg-bg-hover'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </BubbleMenu>

      <EditorContent editor={editor} />
    </div>
  );
}
