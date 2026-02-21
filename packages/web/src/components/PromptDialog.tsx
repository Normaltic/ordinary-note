import { useState, useEffect, useRef } from 'react';

interface PromptDialogProps {
  open: boolean;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({
  open,
  title,
  placeholder,
  defaultValue = '',
  confirmLabel = '확인',
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [open, defaultValue]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onConfirm(value.trim());
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-[var(--z-index-overlay)] flex items-center justify-center bg-bg-overlay">
      <div className="w-full max-w-sm rounded-xl border border-border-default bg-bg-card p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold text-text-primary">{title}</h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-pill px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-hover"
          >
            취소
          </button>
          <button
            onClick={() => value.trim() && onConfirm(value.trim())}
            disabled={!value.trim()}
            className="rounded-pill bg-accent px-4 py-2 text-sm text-text-inverse transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
