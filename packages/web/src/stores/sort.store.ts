import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SortOption = 'name' | 'updatedAt' | 'createdAt';

interface SortState {
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
}

export const useSortStore = create<SortState>()(
  persist(
    (set) => ({
      sortBy: 'name',
      setSortBy: (option) => set({ sortBy: option }),
    }),
    { name: 'sort-preference' },
  ),
);
