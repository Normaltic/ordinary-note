import type {
  FolderTreeNode,
  FolderSummary,
  FolderDetail,
  NoteSummary,
  CreateFolderRequest,
  UpdateFolderRequest,
} from '@ordinary-note/shared';
import { api } from '../axios';

export async function fetchFolderTree(): Promise<FolderTreeNode[]> {
  const { data } = await api.get<{ folders: FolderTreeNode[] }>('/api/folders');
  return data.folders;
}

export async function fetchFolderChildren(
  folderId: string,
): Promise<{ folders: FolderSummary[]; notes: NoteSummary[] }> {
  const { data } = await api.get<{ folders: FolderSummary[]; notes: NoteSummary[] }>(
    `/api/folders/${folderId}/children`,
  );
  return data;
}

export async function createFolder(req: CreateFolderRequest): Promise<FolderDetail> {
  const { data } = await api.post<{ folder: FolderDetail }>('/api/folders', req);
  return data.folder;
}

export async function updateFolder(
  id: string,
  req: UpdateFolderRequest,
): Promise<FolderDetail> {
  const { data } = await api.patch<{ folder: FolderDetail }>(`/api/folders/${id}`, req);
  return data.folder;
}

export async function deleteFolder(id: string): Promise<void> {
  await api.delete(`/api/folders/${id}`);
}
