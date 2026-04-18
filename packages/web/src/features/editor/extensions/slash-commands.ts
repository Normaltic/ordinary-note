import { Extension, type Editor, type Range } from '@tiptap/react';
import { Suggestion, type SuggestionOptions } from '@tiptap/suggestion';

export interface SlashCommandItem {
  title: string;
  keywords: string[];
  command: (props: { editor: Editor; range: Range }) => void;
}

const slashCommands: SlashCommandItem[] = [
  {
    title: '텍스트',
    keywords: ['text', 'paragraph'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: '제목 1',
    keywords: ['heading', 'h1'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: '제목 2',
    keywords: ['heading', 'h2'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: '제목 3',
    keywords: ['heading', 'h3'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: '글머리 목록',
    keywords: ['bullet', 'list', 'ul'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: '번호 목록',
    keywords: ['ordered', 'list', 'ol', 'number'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: '체크리스트',
    keywords: ['checklist', 'task', 'todo'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: '코드 블록',
    keywords: ['code', 'codeblock'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: '테이블',
    keywords: ['table'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: '인용',
    keywords: ['blockquote', 'quote'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: '구분선',
    keywords: ['hr', 'divider', 'horizontal'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: '이미지',
    keywords: ['image', 'img', '사진', 'photo'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/gif,image/webp';
      input.multiple = true;
      input.onchange = () => {
        if (!input.files) return;
        Array.from(input.files).forEach((file) => {
          editor.commands.handleImageUpload(file);
        });
      };
      input.click();
    },
  },
];

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: SlashCommandItem;
        }) => {
          props.command({ editor, range });
        },
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase();
          return slashCommands.filter(
            (item) =>
              item.title.includes(q) ||
              item.keywords.some((kw) => kw.includes(q)),
          );
        },
      } as Partial<SuggestionOptions<SlashCommandItem>>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
