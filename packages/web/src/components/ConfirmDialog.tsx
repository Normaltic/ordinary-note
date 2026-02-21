interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '삭제',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-index-overlay)] flex items-center justify-center bg-bg-overlay">
      <div className="w-full max-w-sm rounded-xl border border-border-default bg-bg-card p-6 shadow-lg">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
        <p className="mb-4 text-sm text-text-secondary">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-pill px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-hover"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="rounded-pill bg-danger px-4 py-2 text-sm text-text-inverse transition-colors hover:bg-danger-hover"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
