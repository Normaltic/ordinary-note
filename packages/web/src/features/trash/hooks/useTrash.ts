import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDeletedNotes,
  restoreNote,
  permanentDeleteNote,
  emptyTrash,
} from '../api/trashApi';

export const trashKeys = {
  all: ['trash'] as const,
  list: (limit?: number) => [...trashKeys.all, limit] as const,
};

export function useDeletedNotes(limit?: number) {
  return useQuery({
    queryKey: trashKeys.list(limit),
    queryFn: () => fetchDeletedNotes(limit),
    staleTime: 30_000,
  });
}

export function useRestoreNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => restoreNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
    },
  });
}

export function usePermanentDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => permanentDeleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
    },
  });
}

export function useEmptyTrash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => emptyTrash(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
    },
  });
}
