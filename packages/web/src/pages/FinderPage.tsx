import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFolderStore } from '../stores/folder.store';
import { useToastStore } from '../stores/toast.store';
import { PromptDialog } from '../components/PromptDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import * as noteApi from '../lib/api/notes';
import type { FolderSummary, NoteSummary } from '@ordinary-note/shared';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isToday) return '오늘';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return '어제';

  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function FinderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const folders = useFolderStore((s) => s.folders);
  const notes = useFolderStore((s) => s.notes);
  const contentsLoading = useFolderStore((s) => s.contentsLoading);
  const fetchContents = useFolderStore((s) => s.fetchContents);
  const fetchRootContents = useFolderStore((s) => s.fetchRootContents);
  const treeLoading = useFolderStore((s) => s.treeLoading);
  const tree = useFolderStore((s) => s.tree);
  const createFolder = useFolderStore((s) => s.createFolder);
  const renameFolder = useFolderStore((s) => s.renameFolder);
  const deleteFolder = useFolderStore((s) => s.deleteFolder);
  const addToast = useToastStore((s) => s.addToast);

  // Dialog states
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptTitle, setPromptTitle] = useState('');
  const [promptDefault, setPromptDefault] = useState('');
  const [promptAction, setPromptAction] = useState<((val: string) => void) | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (folderId) {
      fetchContents(folderId);
    } else if (tree.length > 0) {
      fetchRootContents();
    }
  }, [folderId, fetchContents, fetchRootContents, tree]);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleCreateFolder = () => {
    setPromptTitle('새 폴더');
    setPromptDefault('');
    setPromptAction(() => (name: string) => {
      setPromptOpen(false);
      createFolder(name, folderId);
    });
    setPromptOpen(true);
  };

  const handleRenameFolder = (folder: FolderSummary) => {
    setOpenMenuId(null);
    setPromptTitle('폴더 이름 변경');
    setPromptDefault(folder.name);
    setPromptAction(() => (name: string) => {
      setPromptOpen(false);
      renameFolder(folder.id, name);
    });
    setPromptOpen(true);
  };

  const handleDeleteFolder = (folder: FolderSummary) => {
    setOpenMenuId(null);
    setConfirmTitle('폴더 삭제');
    setConfirmMessage(
      `"${folder.name}" 폴더와 하위 항목이 모두 삭제됩니다. 계속하시겠습니까?`,
    );
    setConfirmAction(() => () => {
      setConfirmOpen(false);
      deleteFolder(folder.id);
    });
    setConfirmOpen(true);
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
    setOpenMenuId(null);
    setConfirmTitle('노트 삭제');
    setConfirmMessage(`"${note.title}" 노트를 삭제하시겠습니까?`);
    setConfirmAction(() => async () => {
      setConfirmOpen(false);
      try {
        await noteApi.deleteNote(note.id);
        if (folderId) {
          await fetchContents(folderId);
        }
        addToast('success', '노트가 삭제되었습니다');
      } catch {
        addToast('error', '노트 삭제에 실패했습니다');
      }
    });
    setConfirmOpen(true);
  };

  if (treeLoading || contentsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-gray-400">로딩 중...</span>
      </div>
    );
  }

  const isEmpty = folders.length === 0 && notes.length === 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      {/* Folder section */}
      {folders.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            폴더
          </h2>
          <div className="space-y-1">
            {folders.map((folder) => (
              <div key={folder.id} className="group relative">
                <Link
                  to={`/folders/${folder.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-100"
                >
                  <span className="text-lg">📁</span>
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {folder.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {folder.childCount > 0 && `${folder.childCount}개 폴더`}
                    {folder.childCount > 0 && folder.noteCount > 0 && ', '}
                    {folder.noteCount > 0 && `${folder.noteCount}개 노트`}
                  </span>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === folder.id ? null : folder.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 opacity-0 hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100"
                >
                  ⋯
                </button>
                {openMenuId === folder.id && (
                  <div
                    ref={menuRef}
                    className="absolute right-2 top-10 z-10 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                  >
                    <button
                      onClick={() => handleRenameFolder(folder)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      이름 변경
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Note section */}
      {notes.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            노트
          </h2>
          <div className="space-y-1">
            {notes.map((note) => (
              <div key={note.id} className="group relative">
                <Link
                  to={`/notes/${note.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-100"
                >
                  <span className="text-lg">📝</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {note.title || '제목 없음'}
                    </div>
                    {note.contentPreview && (
                      <div className="text-xs text-gray-400 truncate">
                        {note.contentPreview}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDate(note.updatedAt)}
                  </span>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === note.id ? null : note.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 opacity-0 hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100"
                >
                  ⋯
                </button>
                {openMenuId === note.id && (
                  <div
                    ref={menuRef}
                    className="absolute right-2 top-10 z-10 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                  >
                    <button
                      onClick={() => handleDeleteNote(note)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="py-20 text-center text-gray-400">
          이 폴더는 비어 있습니다
        </div>
      )}

      {/* Create buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCreateFolder}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          + 새 폴더
        </button>
        {folderId && (
          <button
            onClick={handleCreateNote}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + 새 노트
          </button>
        )}
      </div>

      {/* Dialogs */}
      <PromptDialog
        open={promptOpen}
        title={promptTitle}
        placeholder="이름을 입력하세요"
        defaultValue={promptDefault}
        onConfirm={(val) => promptAction?.(val)}
        onCancel={() => setPromptOpen(false)}
      />
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={() => confirmAction?.()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
