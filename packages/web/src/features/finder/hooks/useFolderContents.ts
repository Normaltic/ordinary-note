import { useEffect, useState } from 'react';
import type { FolderSummary, NoteSummary } from '@ordinary-note/shared';
import { fetchFolderChildren } from '../../../lib/api/folders';

export function useFolderContents(folderId: string) {
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchFolderChildren(folderId)
      .then((result) => {
        if (cancelled) return;
        setFolders(result.folders);
        setNotes(result.notes);
      })
      .catch(() => {
        if (cancelled) return;
        setFolders([]);
        setNotes([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [folderId]);

  return { folders, notes, isLoading };
}
