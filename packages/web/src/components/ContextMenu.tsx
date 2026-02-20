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
      className="absolute right-2 top-10 z-10 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
    >
      {children}
    </div>
  );
}
