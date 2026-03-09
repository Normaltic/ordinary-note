import type { AccessTokenPayload } from '../utils/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      auth?: {
        token: string;
        clientId: string;
        scopes: string[];
      };
    }
  }
}
