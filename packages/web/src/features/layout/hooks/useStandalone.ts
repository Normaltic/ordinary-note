import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useStandalone() {
  const [searchParams, setSearchParams] = useSearchParams();
  const standalone = searchParams.has('standalone');

  const toggleStandalone = useCallback(() => {
    setSearchParams((prev) => {
      if (prev.has('standalone')) {
        prev.delete('standalone');
      } else {
        prev.set('standalone', 'true');
      }
      return prev;
    });
  }, [setSearchParams]);

  return { standalone, toggleStandalone };
}
