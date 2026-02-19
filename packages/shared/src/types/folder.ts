export interface FolderTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  children: FolderTreeNode[];
  noteCount: number;
}

export interface FolderSummary {
  id: string;
  name: string;
  sortOrder: number;
  childCount: number;
  noteCount: number;
}

export interface FolderDetail {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  parentId?: string | null;
  sortOrder?: number;
}
