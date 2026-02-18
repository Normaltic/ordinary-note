export interface AuthUser {
  id: string;
  email: string;
  name: string;
  profileImage: string | null;
}

export interface GoogleLoginRequest {
  credential: string;
}

export interface GoogleLoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface MeResponse {
  user: AuthUser;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
