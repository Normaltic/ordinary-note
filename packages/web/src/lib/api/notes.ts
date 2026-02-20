import type {
  NoteDetail,
  CreateNoteRequest,
  UpdateNoteRequest,
} from '@ordinary-note/shared';
import { api } from '../axios';

export async function fetchNote(id: string): Promise<NoteDetail> {
  const { data } = await api.get<{ note: NoteDetail }>(`/api/notes/${id}`);
  return data.note;
}

export async function createNote(req: CreateNoteRequest): Promise<NoteDetail> {
  const { data } = await api.post<{ note: NoteDetail }>('/api/notes', req);
  return data.note;
}

export async function updateNote(
  id: string,
  req: UpdateNoteRequest,
): Promise<NoteDetail> {
  const { data } = await api.patch<{ note: NoteDetail }>(`/api/notes/${id}`, req);
  return data.note;
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/api/notes/${id}`);
}
