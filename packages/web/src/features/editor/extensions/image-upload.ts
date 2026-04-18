import { Node, type Editor } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@ordinary-note/shared';
import { useToastStore } from '../../../stores/toast.store';

// ── Types ──

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    imagePlaceholder: {
      handleImageUpload: (file: File) => ReturnType;
    };
  }
}

interface ImageUploadOptions {
  uploadFn: ((file: File) => Promise<string>) | null;
}

// ── Image Node ──

export const ImageNode = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'img',
      {
        ...HTMLAttributes,
        class: 'rounded-lg max-w-full my-2',
      },
    ];
  },
});

// ── Image Placeholder Node ──

export const ImageUpload = Node.create<ImageUploadOptions>({
  name: 'imagePlaceholder',
  group: 'block',
  atom: true,
  draggable: false,
  selectable: true,

  addOptions() {
    return { uploadFn: null };
  },

  addAttributes() {
    return {
      uploadId: { default: '' },
      fileName: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-image-placeholder]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-image-placeholder': '', ...HTMLAttributes }];
  },

  addCommands() {
    return {
      handleImageUpload:
        (file: File) =>
        ({ editor }) => {
          const uploadFn = this.options.uploadFn;
          if (!uploadFn) return false;
          handleFileUpload(editor, file, uploadFn);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const uploadFn = this.options.uploadFn;
    if (!uploadFn) return [];

    return [
      new Plugin({
        key: new PluginKey('imageUploadDrop'),
        props: {
          handleDrop: (view, event, _slice, moved) => {
            if (moved || !event.dataTransfer) return false;
            const files = getImageFiles(event.dataTransfer.files);
            if (!files.length) return false;

            event.preventDefault();
            const coords = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });

            const editor = this.editor;
            files.forEach((file) =>
              handleFileUpload(editor, file, uploadFn, coords?.pos),
            );
            return true;
          },

          handlePaste: (view, event) => {
            const files = getImageFiles(event.clipboardData?.files);
            if (!files.length) return false;

            event.preventDefault();
            const editor = this.editor;
            files.forEach((file) => handleFileUpload(editor, file, uploadFn));
            return true;
          },
        },
      }),
    ];
  },
});

// ── Helpers ──

function getImageFiles(fileList?: FileList | null): File[] {
  if (!fileList) return [];
  return Array.from(fileList).filter((f) =>
    (ALLOWED_IMAGE_TYPES as readonly string[]).includes(f.type),
  );
}

function validateFile(file: File): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return '지원하지 않는 이미지 형식입니다.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return '이미지 크기는 10MB 이하여야 합니다.';
  }
  return null;
}

function handleFileUpload(
  editor: Editor,
  file: File,
  uploadFn: (file: File) => Promise<string>,
  pos?: number,
) {
  const error = validateFile(file);
  if (error) {
    useToastStore.getState().addToast('error', error);
    return;
  }

  const uploadId = crypto.randomUUID();
  const placeholderAttrs = { uploadId, fileName: file.name };

  if (pos !== undefined) {
    editor
      .chain()
      .focus()
      .insertContentAt(pos, {
        type: 'imagePlaceholder',
        attrs: placeholderAttrs,
      })
      .run();
  } else {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'imagePlaceholder',
        attrs: placeholderAttrs,
      })
      .run();
  }

  uploadFn(file)
    .then((cdnUrl) => {
      replacePlaceholder(editor, uploadId, cdnUrl);
    })
    .catch(() => {
      removePlaceholder(editor, uploadId);
      useToastStore
        .getState()
        .addToast('error', `이미지 업로드 실패: ${file.name}`);
    });
}

function replacePlaceholder(editor: Editor, uploadId: string, src: string) {
  const { state } = editor;
  const { tr } = state;
  let found = false;

  state.doc.descendants((node, pos) => {
    if (found) return false;
    if (
      node.type.name === 'imagePlaceholder' &&
      node.attrs.uploadId === uploadId
    ) {
      const imageNode = state.schema.nodes.image.create({ src });
      tr.replaceWith(pos, pos + node.nodeSize, imageNode);
      found = true;
      return false;
    }
  });

  if (found) {
    editor.view.dispatch(tr);
  }
}

function removePlaceholder(editor: Editor, uploadId: string) {
  const { state } = editor;
  const { tr } = state;
  let found = false;

  state.doc.descendants((node, pos) => {
    if (found) return false;
    if (
      node.type.name === 'imagePlaceholder' &&
      node.attrs.uploadId === uploadId
    ) {
      tr.delete(pos, pos + node.nodeSize);
      found = true;
      return false;
    }
  });

  if (found) {
    editor.view.dispatch(tr);
  }
}
