import type { Folder } from '../schemas/folder.schema.js';

export interface FolderTreeNode {
  id: Folder['id'];
  name: Folder['name'];
  parentId: Folder['parentId'];
  sortOrder: Folder['sortOrder'];
  children: FolderTreeNode[];
  noteCount: number;
}

export interface FolderSummary {
  id: Folder['id'];
  name: Folder['name'];
  sortOrder: Folder['sortOrder'];
  childCount: number;
  noteCount: number;
}

export interface FolderDetail {
  id: Folder['id'];
  name: Folder['name'];
  parentId: Folder['parentId'];
  sortOrder: Folder['sortOrder'];
  createdAt: string;
  updatedAt: string;
}
