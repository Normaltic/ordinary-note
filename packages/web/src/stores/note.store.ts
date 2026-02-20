import { create } from 'zustand';
import type { NoteDetail, UpdateNoteRequest } from '@ordinary-note/shared';
import * as noteApi from '../lib/api/notes';
import { useToastStore } from './toast.store';

interface NoteState {
  note: NoteDetail | null;
  loading: boolean;
  saving: boolean;

  fetchNote: (id: string) => Promise<void>;
  saveNote: (id: string, req: UpdateNoteRequest) => Promise<void>;
  clearNote: () => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  note: null,
  loading: false,
  saving: false,

  fetchNote: async (id) => {
    set({ loading: true, note: null });
    try {
      const note = await noteApi.fetchNote(id);
      set({ note });
    } catch {
      useToastStore.getState().addToast('error', '노트를 불러오지 못했습니다');
    } finally {
      set({ loading: false });
    }
  },

  saveNote: async (id, req) => {
    set({ saving: true });
    try {
      const note = await noteApi.updateNote(id, req);
      set({ note });
    } catch {
      useToastStore.getState().addToast('error', '저장에 실패했습니다');
    } finally {
      set({ saving: false });
    }
  },

  clearNote: () => {
    set({ note: null, loading: false, saving: false });
  },
}));
