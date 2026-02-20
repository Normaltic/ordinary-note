import { create } from 'zustand';
import type { FolderTreeNode, FolderSummary, NoteSummary } from '@ordinary-note/shared';
import * as folderApi from '../lib/api/folders';
import { useToastStore } from './toast.store';

interface FolderState {
  tree: FolderTreeNode[];
  folders: FolderSummary[];
  notes: NoteSummary[];
  treeLoading: boolean;
  contentsLoading: boolean;

  fetchTree: () => Promise<void>;
  fetchContents: (folderId: string) => Promise<void>;
  fetchRootContents: () => void;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  invalidate: (folderId: string | null) => Promise<void>;
}

function treeToRootSummaries(tree: FolderTreeNode[]): FolderSummary[] {
  return tree.map((node) => ({
    id: node.id,
    name: node.name,
    sortOrder: node.sortOrder,
    childCount: node.children.length,
    noteCount: node.noteCount,
  }));
}

export const useFolderStore = create<FolderState>((set, get) => ({
  tree: [],
  folders: [],
  notes: [],
  treeLoading: false,
  contentsLoading: false,

  fetchTree: async () => {
    set({ treeLoading: true });
    try {
      const tree = await folderApi.fetchFolderTree();
      set({ tree });
    } catch {
      useToastStore.getState().addToast('error', '폴더 트리를 불러오지 못했습니다');
    } finally {
      set({ treeLoading: false });
    }
  },

  fetchContents: async (folderId: string) => {
    set({ contentsLoading: true });
    try {
      const { folders, notes } = await folderApi.fetchFolderChildren(folderId);
      set({ folders, notes });
    } catch {
      useToastStore.getState().addToast('error', '폴더 내용을 불러오지 못했습니다');
    } finally {
      set({ contentsLoading: false });
    }
  },

  fetchRootContents: () => {
    const { tree } = get();
    set({ folders: treeToRootSummaries(tree), notes: [] });
  },

  createFolder: async (name, parentId) => {
    try {
      await folderApi.createFolder({ name, parentId });
      await get().invalidate(parentId ?? null);
      useToastStore.getState().addToast('success', '폴더가 생성되었습니다');
    } catch {
      useToastStore.getState().addToast('error', '폴더 생성에 실패했습니다');
    }
  },

  renameFolder: async (id, name) => {
    try {
      await folderApi.updateFolder(id, { name });
      // Find the folder's parent from tree to re-fetch correct contents
      const parentId = findParentId(get().tree, id);
      await get().invalidate(parentId);
      useToastStore.getState().addToast('success', '폴더 이름이 변경되었습니다');
    } catch {
      useToastStore.getState().addToast('error', '폴더 이름 변경에 실패했습니다');
    }
  },

  deleteFolder: async (id) => {
    try {
      const parentId = findParentId(get().tree, id);
      await folderApi.deleteFolder(id);
      await get().invalidate(parentId);
      useToastStore.getState().addToast('success', '폴더가 삭제되었습니다');
    } catch {
      useToastStore.getState().addToast('error', '폴더 삭제에 실패했습니다');
    }
  },

  invalidate: async (folderId) => {
    await get().fetchTree();
    if (folderId) {
      await get().fetchContents(folderId);
    } else {
      // Re-derive root contents from fresh tree
      get().fetchRootContents();
    }
  },
}));

function findParentId(tree: FolderTreeNode[], targetId: string): string | null {
  for (const node of tree) {
    if (node.children.some((c) => c.id === targetId)) return node.id;
    const found = findParentId(node.children, targetId);
    if (found !== undefined && found !== null) return found;
  }
  return null;
}
