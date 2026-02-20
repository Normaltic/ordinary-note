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
        className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        + 새 폴더
      </button>
      {folderId && (
        <button
          onClick={onCreateNote}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + 새 노트
        </button>
      )}
    </div>
  );
}
