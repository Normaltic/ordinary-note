import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../stores/auth.store';

export function useAuth() {
  const navigate = useNavigate();

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
    }
  };

  return { loginWithGoogle, logout };
}
