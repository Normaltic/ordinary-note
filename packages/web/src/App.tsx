import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { LoginPage } from './pages/LoginPage';
import { AppShell } from './pages/AppShell';
import { FinderPage } from './pages/finder/FinderPage';
import { NotePage } from './pages/NotePage';
import { PrivateRoute } from './components/PrivateRoute';
import { PublicRoute } from './components/PublicRoute';

export function App() {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          <Route index element={<FinderPage />} />
          <Route path="folders/:folderId" element={<FinderPage />} />
          <Route path="notes/:noteId" element={<NotePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
