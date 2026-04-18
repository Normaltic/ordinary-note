import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoteQuery, useDeleteNote } from '../../hooks/queries/useNote';
import { useToastStore } from '../../stores/toast.store';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TiptapEditor } from './components/TiptapEditor';
import { ConnectionStatus } from './components/ConnectionStatus';
import { useCollaboration } from './hooks/useCollaboration';
import { useNoteTitle } from './hooks/useNoteTitle';

interface EditorViewProps {
  noteId: string;
}

export function EditorView({ noteId }: EditorViewProps) {
  const navigate = useNavigate();
  const { data: note, isLoading } = useNoteQuery(noteId);
  const addToast = useToastStore((s) => s.addToast);
  const deleteNoteMutation = useDeleteNote();

  if (isLoading || !note) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-text-muted">로딩 중...</span>
      </div>
    );
  }

  return (
    <EditorContent
      key={noteId}
      noteId={noteId}
      noteTitle={note.title}
      folderId={note.folderId}
      onDelete={() => {
        deleteNoteMutation.mutate(
          { id: noteId, folderId: note.folderId },
          {
            onSuccess: () => {
              addToast('success', '노트가 삭제되었습니다');
              navigate(`/folders/${note.folderId}`);
            },
            onError: () => {
              addToast('error', '노트 삭제에 실패했습니다');
            },
          },
        );
      }}
    />
  );
}

interface EditorContentProps {
  noteId: string;
  noteTitle: string;
  folderId: string;
  onDelete: () => void;
}

function EditorContent({ noteId, noteTitle, onDelete }: EditorContentProps) {
  const { ydoc, synced, connectionStatus } = useCollaboration(noteId);
  const { title, setTitle } = useNoteTitle(noteId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = useCallback(() => {
    setConfirmOpen(false);
    onDelete();
  }, [onDelete]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <ConnectionStatus status={connectionStatus} synced={synced} />
        <button
          onClick={() => setConfirmOpen(true)}
          className="rounded-pill px-3 py-1.5 text-sm text-danger hover:bg-bg-hover"
        >
          삭제
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="mb-4 w-full border-none bg-transparent text-3xl font-bold text-text-primary placeholder-text-muted outline-none"
      />

      <TiptapEditor ydoc={ydoc} noteId={noteId} />

      <ConfirmDialog
        open={confirmOpen}
        title="노트 삭제"
        message={`"${noteTitle || '제목 없음'}" 노트를 삭제하시겠습니까?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
