import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateFolderRequest } from '@ordinary-note/shared';
import { createFolder, updateFolder, deleteFolder } from '../../lib/api/folders';
import { invalidateFolder } from './keys';

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateFolderRequest) => createFolder(params),
    onSuccess: (_data, variables) => {
      invalidateFolder(queryClient, variables.parentId ?? null);
    },
  });
}

export function useRenameFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; name: string; parentId: string | null }) =>
      updateFolder(vars.id, { name: vars.name }),
    onSuccess: (_data, variables) => {
      invalidateFolder(queryClient, variables.parentId);
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; parentId: string | null }) => deleteFolder(vars.id),
    onSuccess: (_data, variables) => {
      invalidateFolder(queryClient, variables.parentId);
    },
  });
}
