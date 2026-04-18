import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

export function ImagePlaceholderView({ node }: NodeViewProps) {
  const { fileName } = node.attrs as { fileName: string };

  return (
    <NodeViewWrapper
      className="flex items-center gap-3 rounded-lg border border-border bg-bg-surface px-4 py-3 my-2"
      contentEditable={false}
    >
      <svg
        className="h-5 w-5 animate-spin text-text-muted"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-sm text-text-primary truncate max-w-60">
          {fileName}
        </span>
        <span className="text-xs text-text-muted">업로드 중...</span>
      </div>
    </NodeViewWrapper>
  );
}
