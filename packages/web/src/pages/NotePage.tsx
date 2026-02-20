import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '../stores/note.store';
import { useFolderStore } from '../stores/folder.store';
import { useToastStore } from '../stores/toast.store';
import { useAutoSave } from '../hooks/useAutoSave';
import { ConfirmDialog } from '../components/ConfirmDialog';
import * as noteApi from '../lib/api/notes';

export function NotePage() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const note = useNoteStore((s) => s.note);
  const loading = useNoteStore((s) => s.loading);
  const saving = useNoteStore((s) => s.saving);
  const fetchNote = useNoteStore((s) => s.fetchNote);
  const saveNote = useNoteStore((s) => s.saveNote);
  const clearNote = useNoteStore((s) => s.clearNote);
  const invalidate = useFolderStore((s) => s.invalidate);
  const addToast = useToastStore((s) => s.addToast);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (noteId) fetchNote(noteId);
    return () => clearNote();
  }, [noteId, fetchNote, clearNote]);

  // Initialize local state when note loads
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.contentPlain ?? '');
    }
  }, [note?.id]);

  // Auto-save
  useAutoSave(
    () => {
      if (noteId && note) {
        saveNote(noteId, { title, contentPlain: content });
      }
    },
    [title, content],
    1000,
  );

  const handleDelete = async () => {
    setConfirmOpen(false);
    if (!noteId || !note) return;
    try {
      await noteApi.deleteNote(noteId);
      addToast('success', '노트가 삭제되었습니다');
      await invalidate(note.folderId);
      navigate(`/folders/${note.folderId}`);
    } catch {
      addToast('error', '노트 삭제에 실패했습니다');
    }
  };

  if (loading || !note) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-gray-400">로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {saving ? '저장 중...' : '저장 완료'}
        </span>
        <button
          onClick={() => setConfirmOpen(true)}
          className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
        >
          삭제
        </button>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="w-full border-none bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none"
      />

      <hr className="my-4 border-gray-200" />

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용을 입력하세요..."
        className="min-h-[60vh] w-full resize-none border-none bg-transparent text-gray-800 placeholder-gray-300 outline-none"
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="노트 삭제"
        message={`"${note.title || '제목 없음'}" 노트를 삭제하시겠습니까?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
