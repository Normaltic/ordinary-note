import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFolderStore } from '../../../stores/folder.store';
import { useToastStore } from '../../../stores/toast.store';
import * as noteApi from '../../../lib/api/notes';
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
  const createFolder = useFolderStore((s) => s.createFolder);
  const renameFolder = useFolderStore((s) => s.renameFolder);
  const deleteFolder = useFolderStore((s) => s.deleteFolder);
  const fetchContents = useFolderStore((s) => s.fetchContents);
  const addToast = useToastStore((s) => s.addToast);

  const [promptDialog, setPromptDialog] = useState<PromptDialogState | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const handleCreateFolder = () => {
    setPromptDialog({
      title: '새 폴더',
      defaultValue: '',
      onConfirm: (name: string) => {
        setPromptDialog(null);
        createFolder(name, folderId);
      },
    });
  };

  const handleRenameFolder = (folder: FolderSummary) => {
    setPromptDialog({
      title: '폴더 이름 변경',
      defaultValue: folder.name,
      onConfirm: (name: string) => {
        setPromptDialog(null);
        renameFolder(folder.id, name);
      },
    });
  };

  const handleDeleteFolder = (folder: FolderSummary) => {
    setConfirmDialog({
      title: '폴더 삭제',
      message: `"${folder.name}" 폴더와 하위 항목이 모두 삭제됩니다. 계속하시겠습니까?`,
      onConfirm: () => {
        setConfirmDialog(null);
        deleteFolder(folder.id);
      },
    });
  };

  const handleCreateNote = async () => {
    if (!folderId) return;
    try {
      const note = await noteApi.createNote({ folderId });
      navigate(`/notes/${note.id}`);
    } catch {
      addToast('error', '노트 생성에 실패했습니다');
    }
  };

  const handleDeleteNote = (note: NoteSummary) => {
    setConfirmDialog({
      title: '노트 삭제',
      message: `"${note.title}" 노트를 삭제하시겠습니까?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await noteApi.deleteNote(note.id);
          if (folderId) {
            await fetchContents(folderId);
          }
          addToast('success', '노트가 삭제되었습니다');
        } catch {
          addToast('error', '노트 삭제에 실패했습니다');
        }
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
