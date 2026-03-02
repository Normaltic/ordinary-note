import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../stores/auth.store';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginWithGoogle = async (credential: string) => {
    const { data } = await api.post('/api/auth/google', { credential });
    useAuthStore.getState().setAuth(data.user, data.accessToken);
    navigate('/', { replace: true });
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      useAuthStore.getState().clearAuth();
      queryClient.clear();
    }
  };

  return { loginWithGoogle, logout };
}
