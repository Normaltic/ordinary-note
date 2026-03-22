import { useQuery } from '@tanstack/react-query';
import { searchNotes } from '../api/searchNotes';

export const searchKeys = {
  all: ['search'] as const,
  query: (q: string, limit?: number) =>
    [...searchKeys.all, q, limit] as const,
};

export function useSearchQuery(query: string, limit?: number) {
  return useQuery({
    queryKey: searchKeys.query(query, limit),
    queryFn: () => searchNotes(query, limit),
    enabled: query.trim().length > 0,
    staleTime: 30_000,
  });
}
