import { useDeletedNotes, useEmptyTrash } from './hooks/useTrash';
import { TrashNoteCard } from './components/TrashNoteCard';

interface TrashNotesProps {
  limit?: number;
}

export function TrashNotes({ limit = 50 }: TrashNotesProps) {
  const { data: notes = [], isLoading } = useDeletedNotes(limit);
  const emptyTrashMutation = useEmptyTrash();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">휴지통</h1>

        {notes.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('휴지통을 비우시겠습니까? 모든 노트가 영구 삭제됩니다.')) {
                emptyTrashMutation.mutate();
              }
            }}
            disabled={emptyTrashMutation.isPending}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] disabled:opacity-50"
          >
            휴지통 비우기
          </button>
        )}
      </div>

      {isLoading && (
        <p className="mt-4 text-sm text-text-muted">불러오는 중...</p>
      )}

      {!isLoading && notes.length === 0 && (
        <p className="mt-4 text-sm text-text-muted">
          휴지통이 비어있습니다
        </p>
      )}

      {!isLoading && notes.length > 0 && (
        <>
          <p className="mt-1 text-sm text-text-muted">
            {notes.length}개의 노트
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {notes.map((note) => (
              <TrashNoteCard key={note.id} note={note} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
