import { useQuery, useMutation, useQueryClient, skipToken } from '@tanstack/react-query';
import type { NoteDetail, CreateNoteRequest, UpdateNoteRequest } from '@ordinary-note/shared';
import { fetchNote, createNote, updateNote, deleteNote } from '../../lib/api/notes';
import { noteKeys, invalidateFolder, invalidateNoteInFolder } from './keys';

export function useNoteQuery(noteId: string | null) {
  return useQuery<NoteDetail>({
    queryKey: noteKeys.detail(noteId ?? ''),
    queryFn: noteId !== null ? () => fetchNote(noteId) : skipToken,
    staleTime: 0,
  });
}

export function useSaveNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteRequest }) => updateNote(id, data),
    onSuccess: (updatedNote) => {
      invalidateNoteInFolder(queryClient, updatedNote.folderId);
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
    },
  });
}
