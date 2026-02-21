interface FinderActionsProps {
  folderId: string | undefined;
  onCreateFolder: () => void;
  onCreateNote: () => void;
}

export function FinderActions({
  folderId,
  onCreateFolder,
  onCreateNote,
}: FinderActionsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onCreateFolder}
        className="rounded-pill border border-border-default px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover"
      >
        + 새 폴더
      </button>
      {folderId && (
        <button
          onClick={onCreateNote}
          className="rounded-pill bg-accent px-4 py-2 text-sm text-text-inverse hover:bg-accent-hover"
        >
          + 새 노트
        </button>
      )}
    </div>
  );
}
