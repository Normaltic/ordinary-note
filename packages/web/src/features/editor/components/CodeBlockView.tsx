import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { lowlight } from '../extensions/lowlight';

const languages = lowlight.listLanguages();

export function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
  return (
    <NodeViewWrapper className="code-block-wrapper">
      <select
        contentEditable={false}
        className="code-block-language"
        value={node.attrs.language || ''}
        onChange={(e) => updateAttributes({ language: e.target.value })}
      >
        <option value="">auto</option>
        {languages.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
      <pre>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
