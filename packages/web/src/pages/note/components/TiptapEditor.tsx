import { useEditor, EditorContent } from '@tiptap/react';
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

  return (
    <div className="flex flex-col gap-3">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
