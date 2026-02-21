import { useToastStore } from '../stores/toast.store';

const typeStyles = {
  success: 'border-l-success',
  error: 'border-l-danger',
} as const;

export function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 z-[var(--z-index-toast)] flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 rounded-lg border-l-4 bg-bg-card px-4 py-3 text-sm shadow-md ${typeStyles[toast.type]}`}
        >
          <span className="text-text-primary">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 text-text-muted transition-colors hover:text-text-primary"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
