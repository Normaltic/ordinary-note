import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { AppShell } from './pages/_layout';
import { LoginPage } from './pages/login';
import { IndexPage } from './pages/index';
import { FolderPage } from './pages/folders/[folderId]';
import { NotePage } from './pages/notes/[noteId]';
import { PrivateRoute } from './features/auth/components/PrivateRoute';
import { PublicRoute } from './features/auth/components/PublicRoute';
import { GlobalErrorHandler } from './features/auth/components/GlobalErrorHandler';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
          <Route index element={<IndexPage />} />
          <Route path="folders/:folderId" element={<FolderPage />} />
          <Route path="notes/:noteId" element={<NotePage />} />
        </Route>
      </Routes>
      </GlobalErrorHandler>
    </BrowserRouter>
    </QueryClientProvider>
  );
}
