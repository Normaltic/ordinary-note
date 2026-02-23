import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TiptapEditor } from './components/TiptapEditor';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useToastStore } from '../../stores/toast.store';
import * as noteApi from '../../lib/api/notes';
import type { NoteDetail } from '@ordinary-note/shared';

interface InlineEditorPanelProps {
  noteId: string;
  onClose: () => void;
}

export function InlineEditorPanel({ noteId, onClose }: InlineEditorPanelProps) {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [note, setNote] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentPlain, setContentPlain] = useState('');

  const contentPlainRef = useRef(contentPlain);
  contentPlainRef.current = contentPlain;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    noteApi.fetchNote(noteId).then((data) => {
      if (cancelled) return;
      setNote(data);
      setTitle(data.title);
      setContentHtml(data.contentHtml ?? data.contentPlain ?? '');
      setContentPlain(data.contentPlain ?? '');
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      addToast('error', '노트를 불러오지 못했습니다');
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [noteId, addToast]);

  const handleEditorUpdate = useCallback((html: string, plain: string) => {
    setContentHtml(html);
    setContentPlain(plain);
  }, []);

  const save = useCallback(() => {
    if (!note) return;
    setSaving(true);
    noteApi.updateNote(noteId, {
      title,
      contentHtml,
      contentPlain: contentPlainRef.current,
    }).then((updated) => {
      setNote(updated);
    }).catch(() => {
      addToast('error', '저장에 실패했습니다');
    }).finally(() => {
      setSaving(false);
    });
  }, [noteId, note, title, contentHtml, addToast]);

  const { flush } = useAutoSave(save, [title, contentHtml], 1000);

  const handleExpand = useCallback(() => {
    flush();
    navigate(`/notes/${noteId}`);
  }, [flush, navigate, noteId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-6">
        <span className="text-text-muted">로딩 중...</span>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-6">
        <span className="text-text-muted">노트를 불러올 수 없습니다</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-6 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {saving ? '저장 중...' : '저장 완료'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExpand}
            className="rounded-pill px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover"
          >
            확장
          </button>
          <button
            onClick={onClose}
            className="rounded-pill px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover"
          >
            닫기
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="w-full border-none bg-transparent text-3xl font-bold text-text-primary placeholder-text-muted outline-none"
      />

      <hr className="my-4 border-border-default" />

      {/* Editor */}
      <TiptapEditor
        key={noteId}
        initialContent={contentHtml}
        onUpdate={handleEditorUpdate}
      />
    </div>
  );
}
