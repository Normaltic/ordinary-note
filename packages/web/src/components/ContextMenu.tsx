import { useRef, type ReactNode } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';

interface ContextMenuProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function ContextMenu({ open, onClose, children }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-2 top-10 z-[var(--z-index-context-menu)] w-36 overflow-hidden rounded border border-border-default bg-bg-card shadow-md"
    >
      {children}
    </div>
  );
}
