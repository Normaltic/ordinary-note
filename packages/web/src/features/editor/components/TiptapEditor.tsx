import { useCallback, useRef } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { TableKit } from '@tiptap/extension-table';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Collaboration from '@tiptap/extension-collaboration';
import { lowlight } from '../extensions/lowlight';
import { SlashCommands } from '../extensions/slash-commands';
import { slashCommandRender } from '../extensions/slash-command-render';
import DragHandle from '@tiptap/extension-drag-handle-react';
import { CodeBlockView } from './CodeBlockView';
import { TableMenu } from './TableMenu';
import type { Doc } from 'yjs';

const NESTED_DRAG_CONFIG = {
  edgeDetection: { threshold: -16 },
  rules: [
    {
      id: 'excludeNonListContainers',
      evaluate: ({ parent }: { parent: { type: { name: string } } | null }) => {
        if (!parent) return 0;
        const name = parent.type.name;
        if (
          name === 'blockquote' ||
          name === 'tableCell' ||
          name === 'tableHeader'
        ) {
          return 9999;
        }
        return 0;
      },
    },
  ],
};

interface TiptapEditorProps {
  ydoc: Doc;
}

export function TiptapEditor({ ydoc }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false, codeBlock: false }),
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
      Link.configure({ openOnClick: false }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        enableTabIndentation: true,
      }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockView);
        },
      }),
      TableKit.configure({
        table: { resizable: true },
      }),
      SlashCommands.configure({
        suggestion: { render: slashCommandRender },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Collaboration.configure({ document: ydoc }),
    ],
  });

  const currentNodeEl = useRef<HTMLElement | null>(null);

  const handleDragNodeChange = useCallback(
    ({ pos }: { pos: number }) => {
      if (!editor) return;
      const dom = editor.view.nodeDOM(pos);
      currentNodeEl.current = dom instanceof HTMLElement ? dom : null;
    },
    [editor],
  );

  const getDragVirtualElement = useCallback(() => {
    const editorEl = editor?.view.dom;
    const nodeEl = currentNodeEl.current;
    if (!editorEl || !nodeEl) return null;
    const editorRect = editorEl.getBoundingClientRect();
    const nodeRect = nodeEl.getBoundingClientRect();
    return {
      getBoundingClientRect: () => ({
        ...nodeRect,
        x: editorRect.x,
        left: editorRect.left,
        right: editorRect.left + nodeRect.width,
        width: nodeRect.width,
      }),
    };
  }, [editor]);

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

      <DragHandle
        editor={editor}
        nested={NESTED_DRAG_CONFIG}
        onNodeChange={handleDragNodeChange}
        getReferencedVirtualElement={getDragVirtualElement}
        computePositionConfig={{ placement: 'left-start' }}
      >
        <div className="drag-handle">⠿</div>
      </DragHandle>

      <div className="relative">
        <TableMenu editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
