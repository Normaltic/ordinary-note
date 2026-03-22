import { api } from '../../../lib/axios';
import type { RecentNote } from '../../recent/api/fetchRecentNotes';

export async function fetchPinnedNotes(
  limit?: number,
): Promise<RecentNote[]> {
  const { data } = await api.get<{ notes: RecentNote[] }>(
    '/api/notes/pinned',
    { params: { limit } },
  );
  return data.notes;
}
