import {
  useCallback,
} from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  skipToken,
  keepPreviousData,
} from '@tanstack/react-query';
import type {
  NoteDetail,
  CreateNoteRequest,
  UpdateNoteRequest,
} from '@ordinary-note/shared';
import {
  fetchNote,
  createNote,
  updateNote,
  deleteNote,
} from '../../lib/api/notes';
import { noteKeys, invalidateFolder, invalidateNoteInFolder } from './keys';
import { pinnedKeys } from '../../features/pinned/hooks/usePinnedNotes';
import { recentKeys } from '../../features/recent/hooks/useRecentNotes';
import { trashKeys } from '../../features/trash/hooks/useTrash';

export function useNoteQuery(noteId: string | null) {
  return useQuery<NoteDetail>({
    queryKey: noteKeys.detail(noteId ?? ''),
    queryFn: noteId !== null ? () => fetchNote(noteId) : skipToken,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

export function usePrefetchNote() {
  const queryClient = useQueryClient();
  return useCallback(
    (noteId: string) => {
      queryClient.prefetchQuery({
        queryKey: noteKeys.detail(noteId),
        queryFn: () => fetchNote(noteId),
      });
    },
    [queryClient],
  );
}

export function useSaveNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteRequest }) =>
      updateNote(id, data),
    onSuccess: (updatedNote) => {
      queryClient.setQueryData(noteKeys.detail(updatedNote.id), updatedNote);
      invalidateNoteInFolder(queryClient, updatedNote.folderId);
      queryClient.invalidateQueries({ queryKey: pinnedKeys.all });
      queryClient.invalidateQueries({ queryKey: recentKeys.all });
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateNoteRequest) => createNote(params),
    onSuccess: (note) => {
      invalidateFolder(queryClient, note.folderId);
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; folderId: string }) => deleteNote(vars.id),
    onSuccess: (_data, variables) => {
      invalidateFolder(queryClient, variables.folderId);
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
    },
  });
}
