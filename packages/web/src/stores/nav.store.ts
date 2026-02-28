import { create } from 'zustand';

interface NavState {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

export const useNavStore = create<NavState>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
}));
