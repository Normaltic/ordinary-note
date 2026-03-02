import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../../stores/toast.store';
import { useCreateFolder, useRenameFolder, useDeleteFolder } from '../../../hooks/queries/useFolder';
import { useCreateNote, useDeleteNote } from '../../../hooks/queries/useNote';
import type { FolderSummary, NoteSummary } from '@ordinary-note/shared';

interface PromptDialogState {
  title: string;
  defaultValue: string;
  onConfirm: (value: string) => void;
}

interface ConfirmDialogState {
  title: string;
  message: string;
  onConfirm: () => void;
}

export function useFinderActions(folderId: string | undefined) {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [promptDialog, setPromptDialog] = useState<PromptDialogState | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  const handleCreateFolder = () => {
    setPromptDialog({
      title: '새 폴더',
      defaultValue: '',
      onConfirm: (name: string) => {
        setPromptDialog(null);
        createFolder.mutate(
          { name, parentId: folderId },
          {
            onSuccess: () => addToast('success', '폴더가 생성되었습니다'),
            onError: () => addToast('error', '폴더 생성에 실패했습니다'),
          },
        );
      },
    });
  };

  const handleRenameFolder = (folder: FolderSummary) => {
    setPromptDialog({
      title: '폴더 이름 변경',
      defaultValue: folder.name,
      onConfirm: (name: string) => {
        setPromptDialog(null);
        renameFolder.mutate(
          { id: folder.id, name, parentId: folderId ?? null },
          {
            onSuccess: () => addToast('success', '폴더 이름이 변경되었습니다'),
            onError: () => addToast('error', '폴더 이름 변경에 실패했습니다'),
          },
        );
      },
    });
  };

  const handleDeleteFolder = (folder: FolderSummary) => {
    setConfirmDialog({
      title: '폴더 삭제',
      message: `"${folder.name}" 폴더와 하위 항목이 모두 삭제됩니다. 계속하시겠습니까?`,
      onConfirm: () => {
        setConfirmDialog(null);
        deleteFolder.mutate(
          { id: folder.id, parentId: folderId ?? null },
          {
            onSuccess: () => addToast('success', '폴더가 삭제되었습니다'),
            onError: () => addToast('error', '폴더 삭제에 실패했습니다'),
          },
        );
      },
    });
  };

  const handleCreateNote = () => {
    if (!folderId) return;
    createNote.mutate(
      { folderId },
      {
        onSuccess: (note) => navigate(`/notes/${note.id}`),
        onError: () => addToast('error', '노트 생성에 실패했습니다'),
      },
    );
  };

  const handleDeleteNote = (note: NoteSummary) => {
    setConfirmDialog({
      title: '노트 삭제',
      message: `"${note.title}" 노트를 삭제하시겠습니까?`,
      onConfirm: () => {
        setConfirmDialog(null);
        deleteNote.mutate(
          { id: note.id, folderId: folderId! },
          {
            onSuccess: () => addToast('success', '노트가 삭제되었습니다'),
            onError: () => addToast('error', '노트 삭제에 실패했습니다'),
          },
        );
      },
    });
  };

  return {
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleCreateNote,
    handleDeleteNote,
    promptDialogProps: promptDialog
      ? {
          open: true as const,
          title: promptDialog.title,
          defaultValue: promptDialog.defaultValue,
          onConfirm: promptDialog.onConfirm,
          onCancel: () => setPromptDialog(null),
        }
      : {
          open: false as const,
          title: '',
          defaultValue: '',
          onConfirm: () => {},
          onCancel: () => {},
        },
    confirmDialogProps: confirmDialog
      ? {
          open: true as const,
          title: confirmDialog.title,
          message: confirmDialog.message,
          onConfirm: confirmDialog.onConfirm,
          onCancel: () => setConfirmDialog(null),
        }
      : {
          open: false as const,
          title: '',
          message: '',
          onConfirm: () => {},
          onCancel: () => {},
        },
  };
}
