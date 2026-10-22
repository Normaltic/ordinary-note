import { Extension } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { DOMSerializer, type Fragment } from '@tiptap/pm/model';

const TASK_MARKER_ATTR = 'data-task-marker';
const TASK_MARKER_RE = new RegExp(`<span ${TASK_MARKER_ATTR}="">.*?</span>`, 'g');

function unwrap(el: Element) {
  el.replaceWith(...Array.from(el.childNodes));
}

/**
 * 복사 HTML을 외부 앱(Slack 등)이 인식하는 표준 리스트 구조로 정리한다.
 * - li > p 를 풀어 텍스트를 li에 직접 둔다 (여러 문단은 <br>로 구분)
 * - 체크리스트의 label/input 은 ☑/☐ 텍스트로 대체
 */
function normalizeLists(root: HTMLElement | DocumentFragment) {
  const doc = root.ownerDocument!;

  root.querySelectorAll('li[data-type="taskItem"]').forEach((li) => {
    const label = li.querySelector(':scope > label');
    if (label) {
      const marker = doc.createElement('span');
      marker.setAttribute(TASK_MARKER_ATTR, '');
      marker.textContent = li.getAttribute('data-checked') === 'true' ? '☑ ' : '☐ ';
      label.replaceWith(marker);
    }
    li.querySelectorAll(':scope > div').forEach(unwrap);
  });

  root.querySelectorAll('li').forEach((li) => {
    const paragraphs = li.querySelectorAll(':scope > p');
    paragraphs.forEach((p, i) => {
      if (i > 0) p.before(doc.createElement('br'));
      unwrap(p);
    });
  });
}

class ClipboardSerializer extends DOMSerializer {
  serializeFragment(
    fragment: Fragment,
    options?: { document?: Document },
    target?: HTMLElement | DocumentFragment,
  ) {
    const dom = super.serializeFragment(fragment, options, target);
    normalizeLists(dom);
    return dom;
  }
}

export const ClipboardHtml = Extension.create({
  name: 'clipboardHtml',

  addProseMirrorPlugins() {
    const base = DOMSerializer.fromSchema(this.editor.schema);
    return [
      new Plugin({
        key: new PluginKey('clipboardHtml'),
        props: {
          clipboardSerializer: new ClipboardSerializer(base.nodes, base.marks),
          // 자체 복사본을 다시 붙여넣을 때 체크 표식 제거 (체크 상태는 data-checked로 복원됨)
          transformPastedHTML: (html) => html.replace(TASK_MARKER_RE, ''),
        },
      }),
    ];
  },
});
