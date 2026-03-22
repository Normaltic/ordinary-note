import { useQuery } from '@tanstack/react-query';
import { fetchPinnedNotes } from '../api/fetchPinnedNotes';

export const pinnedKeys = {
  all: ['pinned'] as const,
  list: (limit?: number) => [...pinnedKeys.all, limit] as const,
};

export function usePinnedNotes(limit?: number) {
  return useQuery({
    queryKey: pinnedKeys.list(limit),
    queryFn: () => fetchPinnedNotes(limit),
    staleTime: 30_000,
  });
}
