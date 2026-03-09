import { useEffect, useState, useRef } from 'react';
import { Doc } from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { useAuthStore } from '../../../stores/auth.store';
import { auth } from '../../../lib/auth';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function useCollaboration(noteId: string) {
  const [ydoc] = useState(() => new Doc());
  const [synced, setSynced] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting');

  const providerRef = useRef<HocuspocusProvider | null>(null);

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost =
      import.meta.env.VITE_WS_URL ||
      `${wsProtocol}//${window.location.hostname}:3001`;

    const provider = new HocuspocusProvider({
      url: `${wsHost}/collaboration`,
      name: noteId,
      document: ydoc,
      token: () => auth.getAccessToken() ?? '',
      onSynced({ state }) {
        setSynced(state);
      },
      onStatus({ status }) {
        setConnectionStatus(status as ConnectionStatus);
      },
      onAuthenticationFailed({ reason }) {
        console.error('Collaboration auth failed:', reason);
        auth.refreshAccessToken().then((token) => {
          if (!token) {
            useAuthStore.getState().clearAuth();
          }
        });
      },
    });

    providerRef.current = provider;

    return () => {
      provider.destroy();
      ydoc.destroy();
      providerRef.current = null;
    };
  }, [noteId, ydoc]);

  return { ydoc, synced, connectionStatus };
}
