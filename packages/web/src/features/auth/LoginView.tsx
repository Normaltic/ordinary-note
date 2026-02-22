import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from './hooks/useAuth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

export function LoginView() {
  const { loginWithGoogle } = useAuth();

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;

    try {
      await loginWithGoogle(credentialResponse.credential);
    } catch {
      // TODO: show error toast
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="w-full max-w-sm rounded-xl border border-border-default bg-bg-card p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold text-text-primary">Ordinary Note</h1>
        <p className="mb-8 text-center text-sm text-text-secondary">로그인하여 시작하기</p>
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
    </GoogleOAuthProvider>
  );
}
