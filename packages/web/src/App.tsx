import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { AppShell } from './pages/AppShell';
import { FinderPage } from './pages/finder/FinderPage';
import { NotePage } from './pages/note/NotePage';
import { PrivateRoute } from './components/PrivateRoute';
import { PublicRoute } from './components/PublicRoute';
import { GlobalErrorHandler } from './components/GlobalErrorHandler';

export function App() {
  return (
    <BrowserRouter>
      <GlobalErrorHandler>
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
      </GlobalErrorHandler>
    </BrowserRouter>
  );
}
