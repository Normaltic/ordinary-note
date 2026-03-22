import { api } from '../../../lib/axios';

export interface DeletedNote {
  id: string;
  title: string;
  contentPlain: string | null;
  folderId: string;
  folderName: string | null;
  deletedAt: string;
  updatedAt: string;
}

export async function fetchDeletedNotes(
  limit?: number,
): Promise<DeletedNote[]> {
  const { data } = await api.get<{ notes: DeletedNote[] }>(
    '/api/notes/deleted',
    { params: { limit } },
  );
  return data.notes;
}

export async function restoreNote(noteId: string) {
  const { data } = await api.patch<{ note: unknown }>(
    `/api/notes/${noteId}/restore`,
  );
  return data.note;
}

export async function permanentDeleteNote(noteId: string) {
  const { data } = await api.delete<{ id: string }>(
    `/api/notes/${noteId}/permanent`,
  );
  return data;
}

export async function emptyTrash() {
  const { data } = await api.delete<{ success: boolean }>('/api/notes/trash');
  return data;
}
