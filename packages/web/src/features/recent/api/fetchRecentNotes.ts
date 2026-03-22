import { api } from '../../../lib/axios';

export interface RecentNote {
  id: string;
  title: string;
  contentPlain: string | null;
  folderId: string;
  folderName: string | null;
  updatedAt: string;
}

export async function fetchRecentNotes(
  limit?: number,
): Promise<RecentNote[]> {
  const { data } = await api.get<{ notes: RecentNote[] }>(
    '/api/notes/recent',
    { params: { limit } },
  );
  return data.notes;
}
