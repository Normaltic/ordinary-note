import { api } from '../../../lib/axios';

export interface SearchResult {
  id: string;
  title: string;
  contentPlain: string | null;
  folderId: string;
  folderName: string | null;
  updatedAt: string;
}

export async function searchNotes(
  query: string,
  limit?: number,
): Promise<SearchResult[]> {
  const { data } = await api.get<{ notes: SearchResult[] }>(
    '/api/notes/search',
    { params: { query, limit } },
  );
  return data.notes;
}
