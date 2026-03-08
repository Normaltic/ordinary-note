import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const activeStates = useEditorState({
    editor,
    selector: (ctx) => ({
      h1: ctx.editor.isActive('heading', { level: 1 }),
      h2: ctx.editor.isActive('heading', { level: 2 }),
      h3: ctx.editor.isActive('heading', { level: 3 }),
      bulletList: ctx.editor.isActive('bulletList'),
      orderedList: ctx.editor.isActive('orderedList'),
      taskList: ctx.editor.isActive('taskList'),
      blockquote: ctx.editor.isActive('blockquote'),
      codeBlock: ctx.editor.isActive('codeBlock'),
      table: ctx.editor.isActive('table'),
    }),
  });

  const groups = [
    [
      {
        label: 'H1',
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: activeStates.h1,
      },
      {
        label: 'H2',
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: activeStates.h2,
      },
      {
        label: 'H3',
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: activeStates.h3,
      },
    ],
    [
      {
        label: 'Bullet',
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: activeStates.bulletList,
      },
      {
        label: 'Ordered',
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: activeStates.orderedList,
      },
      {
        label: 'Check',
        action: () => editor.chain().focus().toggleTaskList().run(),
        isActive: activeStates.taskList,
      },
    ],
    [
      {
        label: 'Quote',
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: activeStates.blockquote,
      },
      {
        label: 'Code Block',
        action: () => editor.chain().focus().toggleCodeBlock().run(),
        isActive: activeStates.codeBlock,
      },
      {
        label: 'Table',
        action: () =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
        isActive: activeStates.table,
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
