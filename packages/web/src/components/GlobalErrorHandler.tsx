import { useEffect } from 'react';
import { isAxiosError } from 'axios';
import { useAuthStore } from '../stores/auth.store';
import { CancelledError } from '../lib/axios';

export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof CancelledError) {
        event.preventDefault();
        return;
      }

      if (isAxiosError(event.reason) && event.reason.response?.status === 401) {
        event.preventDefault();
        useAuthStore.getState().clearAuth();
      }
    };

    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  return <>{children}</>;
}
