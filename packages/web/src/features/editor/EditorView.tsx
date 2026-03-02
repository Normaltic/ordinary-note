import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TiptapEditor } from './components/TiptapEditor';
import { ConnectionStatus } from './components/ConnectionStatus';
import { useNoteEditor } from './hooks/useNoteEditor';

export function EditorView() {
  const {
    note,
    loading,
    title,
    setTitle,
    ydoc,
    synced,
    connectionStatus,
    handleDelete,
    confirmOpen,
    setConfirmOpen,
  } = useNoteEditor();

  if (loading || !note) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-text-muted">로딩 중...</span>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <ConnectionStatus status={connectionStatus} synced={synced} />
        <button
          onClick={() => setConfirmOpen(true)}
          className="rounded-pill px-3 py-1.5 text-sm text-danger hover:bg-bg-hover"
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
        className="w-full border-none bg-transparent text-3xl font-bold text-text-primary placeholder-text-muted outline-none"
      />

      <hr className="my-4 border-border-default" />

      {/* Editor */}
      {ydoc && <TiptapEditor key={note.id} ydoc={ydoc} />}

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="노트 삭제"
        message={`"${note.title || '제목 없음'}" 노트를 삭제하시겠습니까?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
