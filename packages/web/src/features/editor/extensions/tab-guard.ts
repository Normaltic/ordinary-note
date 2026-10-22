import { Extension } from '@tiptap/react';

/**
 * 에디터 내 Tab/Shift-Tab이 브라우저 포커스 이동으로 새어나가지 않도록 막는다.
 * 리스트·코드블록·테이블 등이 먼저 처리하고, 처리 불가(예: 첫 리스트 항목 들여쓰기)일 때만 여기서 소비한다.
 */
export const TabGuard = Extension.create({
  name: 'tabGuard',
  // 기본 우선순위(100)보다 낮게 두어 다른 확장의 Tab 핸들러 이후에 실행
  priority: 1,

  addKeyboardShortcuts() {
    return {
      Tab: () => true,
      'Shift-Tab': () => true,
    };
  },
});
