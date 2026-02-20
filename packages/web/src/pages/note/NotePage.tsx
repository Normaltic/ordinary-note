import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TiptapEditor } from './components/TiptapEditor';
import { useNoteEditor } from './hooks/useNoteEditor';

export function NotePage() {
  const {
    note,
    loading,
    saving,
    title,
    setTitle,
    contentHtml,
    handleEditorUpdate,
    handleDelete,
    confirmOpen,
    setConfirmOpen,
  } = useNoteEditor();

  if (loading || !note) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-gray-400">로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {saving ? '저장 중...' : '저장 완료'}
        </span>
        <button
          onClick={() => setConfirmOpen(true)}
          className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
        >
          삭제
        </button>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="w-full border-none bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none"
      />

      <hr className="my-4 border-gray-200" />

      {/* Editor */}
      <TiptapEditor
        key={note.id}
        initialContent={contentHtml}
        onUpdate={handleEditorUpdate}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="노트 삭제"
        message={`"${note.title || '제목 없음'}" 노트를 삭제하시겠습니까?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
