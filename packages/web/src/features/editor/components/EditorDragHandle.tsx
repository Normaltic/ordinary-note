import { useCallback, useRef } from 'react';
import DragHandle from '@tiptap/extension-drag-handle-react';
import type { Editor } from '@tiptap/react';

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

interface EditorDragHandleProps {
  editor: Editor;
}

export function EditorDragHandle({ editor }: EditorDragHandleProps) {
  const currentNodeEl = useRef<HTMLElement | null>(null);

  const handleNodeChange = useCallback(
    ({ pos }: { pos: number }) => {
      const dom = editor.view.nodeDOM(pos);
      currentNodeEl.current = dom instanceof HTMLElement ? dom : null;
    },
    [editor],
  );

  const getVirtualElement = useCallback(() => {
    const editorEl = editor.view.dom;
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

  return (
    <DragHandle
      editor={editor}
      nested={NESTED_DRAG_CONFIG}
      onNodeChange={handleNodeChange}
      getReferencedVirtualElement={getVirtualElement}
      computePositionConfig={{ placement: 'left-start' }}
    >
      <div className="drag-handle">⠿</div>
    </DragHandle>
  );
}
