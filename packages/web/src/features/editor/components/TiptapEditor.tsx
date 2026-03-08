import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
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
import { CodeBlockView } from './CodeBlockView';
import { TableMenu } from './TableMenu';
import { EditorBubbleMenu } from './EditorBubbleMenu';
import { EditorDragHandle } from './EditorDragHandle';
import type { Doc } from 'yjs';

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

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-3">
      <EditorBubbleMenu editor={editor} />
      <EditorDragHandle editor={editor} />

      <div className="relative">
        <TableMenu editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
