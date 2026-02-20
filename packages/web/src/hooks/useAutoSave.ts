import { useEffect, useRef, useCallback } from 'react';

export function useAutoSave(
  save: () => void,
  deps: unknown[],
  delay = 1000,
) {
  const isFirstRender = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      saveRef.current();
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      saveRef.current();
    }, delay);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, deps);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        saveRef.current();
      }
    };
  }, []);

  return { flush };
}
