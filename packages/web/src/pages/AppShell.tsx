import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Ordinary Note</h1>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-gray-600">{user.name}</span>
              <button
                onClick={logout}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200"
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
