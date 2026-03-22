import type { DeletedNote } from '../api/trashApi';
import { useRestoreNote, usePermanentDeleteNote } from '../hooks/useTrash';

interface TrashNoteCardProps {
  note: DeletedNote;
}

export function TrashNoteCard({ note }: TrashNoteCardProps) {
  const restoreMutation = useRestoreNote();
  const permanentDeleteMutation = usePermanentDeleteNote();
  const snippet = note.contentPlain?.slice(0, 200) ?? '';

  return (
    <div className="rounded-md border border-border-light bg-bg-card px-4 py-3">
      <div className="text-base font-medium text-text-primary">
        {note.title || '제목 없음'}
      </div>

      {note.folderName && (
        <div className="mt-1 text-xs text-text-muted">{note.folderName}</div>
      )}

      {snippet && (
        <div className="mt-1.5 text-sm text-text-secondary line-clamp-2">
          {snippet}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {new Date(note.deletedAt).toLocaleDateString('ko-KR')} 삭제
        </span>

        <div className="flex gap-2">
          <button
            onClick={() => restoreMutation.mutate(note.id)}
            disabled={restoreMutation.isPending}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent-subtle disabled:opacity-50"
          >
            복원
          </button>
          <button
            onClick={() => {
              if (window.confirm('이 노트를 영구 삭제하시겠습니까?')) {
                permanentDeleteMutation.mutate(note.id);
              }
            }}
            disabled={permanentDeleteMutation.isPending}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] disabled:opacity-50"
          >
            영구 삭제
          </button>
        </div>
      </div>
    </div>
  );
}
