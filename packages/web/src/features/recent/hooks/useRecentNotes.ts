import { useQuery } from '@tanstack/react-query';
import { fetchRecentNotes } from '../api/fetchRecentNotes';

export const recentKeys = {
  all: ['recent'] as const,
  list: (limit?: number) => [...recentKeys.all, limit] as const,
};

export function useRecentNotes(limit?: number) {
  return useQuery({
    queryKey: recentKeys.list(limit),
    queryFn: () => fetchRecentNotes(limit),
    staleTime: 30_000,
  });
}
