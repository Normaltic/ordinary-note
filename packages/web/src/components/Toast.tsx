import { useToastStore } from '../stores/toast.store';

export function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 opacity-70 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
