import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { useAuthStore } from '../stores/auth.store';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;

    try {
      const { data } = await api.post('/api/auth/google', {
        credential: credentialResponse.credential,
      });
      setAuth(data.user, data.accessToken);
      navigate('/', { replace: true });
    } catch {
      // TODO: show error toast
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Ordinary Note</h1>
          <p className="mb-8 text-center text-sm text-gray-500">로그인하여 시작하기</p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => {
                // TODO: show error toast
              }}
              size="large"
              width="300"
            />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
