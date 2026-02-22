import { Outlet } from 'react-router-dom';
import { ShellLayout } from '../features/layout/ShellLayout';

export function AppShell() {
  return (
    <ShellLayout>
      <Outlet />
    </ShellLayout>
  );
}
