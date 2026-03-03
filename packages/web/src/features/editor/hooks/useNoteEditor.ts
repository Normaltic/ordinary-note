import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Doc } from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { useNoteQuery, useSaveNote, useDeleteNote } from '../../../hooks/queries/useNote';
import { useToastStore } from '../../../stores/toast.store';
import { useAutoSave } from '../../../hooks/useAutoSave';
import { auth } from '../../../lib/auth';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function useNoteEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { data: note, isLoading: loading } = useNoteQuery(noteId ?? null);
  const saveNoteMutation = useSaveNote();
  const deleteNoteMutation = useDeleteNote();
  const addToast = useToastStore((s) => s.addToast);

  const [title, setTitle] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ydoc, setYdoc] = useState<Doc | null>(null);
  const [synced, setSynced] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  const providerRef = useRef<HocuspocusProvider | null>(null);

  // Initialize local state when note loads
  useEffect(() => {
    if (note) {
      setTitle(note.title);
    }
  }, [note?.id]);

  // Yjs / Hocuspocus provider lifecycle
  useEffect(() => {
    if (!noteId) return;

    const doc = new Doc();

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.hostname}:3001`;

    const provider = new HocuspocusProvider({
      url: `${wsHost}/collaboration`,
      name: noteId,
      document: doc,
      token: () => auth.getAccessToken() ?? '',
      onSynced({ state }) {
        setSynced(state);
      },
      onStatus({ status }) {
        setConnectionStatus(status as ConnectionStatus);
      },
      onAuthenticationFailed({ reason }) {
        console.error('Collaboration auth failed:', reason);
        addToast('error', '실시간 동기화 인증에 실패했습니다');
      },
    });

    setYdoc(doc);
    providerRef.current = provider;

    return () => {
      provider.destroy();
      doc.destroy();
      setYdoc(null);
      setSynced(false);
      setConnectionStatus('connecting');
      providerRef.current = null;
    };
  }, [noteId]);

  // Title auto-save (REST)
  useAutoSave(
    () => {
      if (noteId && note) {
        saveNoteMutation.mutate({ id: noteId, data: { title } });
      }
    },
    [title],
    1000,
  );

  const handleDelete = useCallback(() => {
    setConfirmOpen(false);
    if (!noteId || !note) return;
    deleteNoteMutation.mutate(
      { id: noteId, folderId: note.folderId },
      {
        onSuccess: () => {
          addToast('success', '노트가 삭제되었습니다');
          navigate(`/folders/${note.folderId}`);
        },
        onError: () => {
          addToast('error', '노트 삭제에 실패했습니다');
        },
      },
    );
  }, [noteId, note, deleteNoteMutation, addToast, navigate]);

  return {
    note: note ?? null,
    loading,
    title,
    setTitle,
    ydoc,
    synced,
    connectionStatus,
    handleDelete,
    confirmOpen,
    setConfirmOpen,
  };
}
