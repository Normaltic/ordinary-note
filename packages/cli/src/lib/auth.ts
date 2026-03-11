import fs from 'node:fs';
import crypto from 'node:crypto';
import http from 'node:http';
import { CONFIG_DIR, AUTH_FILE, getServerUrl } from './config.js';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  client_id: string;
  server_url: string;
}

export function loadTokens(): AuthTokens | null {
  try {
    const data = fs.readFileSync(AUTH_FILE, 'utf-8');
    return JSON.parse(data) as AuthTokens;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: AuthTokens): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(tokens, null, 2));
}

export function clearTokens(): void {
  try {
    fs.unlinkSync(AUTH_FILE);
  } catch {
    // ignore if file doesn't exist
  }
}

export function getAccessToken(): string {
  const tokens = loadTokens();
  if (!tokens) {
    console.error('Not logged in. Run: ordin login');
    return process.exit(1);
  }
  return tokens.access_token;
}

export async function refreshAccessToken(): Promise<string | null> {
  const tokens = loadTokens();
  if (!tokens?.refresh_token) return null;

  const serverUrl = tokens.server_url ?? getServerUrl();

  try {
    const res = await fetch(`${serverUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        client_id: tokens.client_id,
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
    };

    saveTokens({
      ...tokens,
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? tokens.refresh_token,
    });

    return data.access_token;
  } catch {
    return null;
  }
}

// PKCE helpers
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64url');
}

export async function loginFlow(): Promise<void> {
  const serverUrl = getServerUrl();

  // 1. Register client
  const registerRes = await fetch(`${serverUrl}/oauth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      redirect_uris: ['http://127.0.0.1:0/callback'],
      client_name: 'ordinary-note-cli',
    }),
  });

  if (!registerRes.ok) {
    throw new Error(`Client registration failed: ${registerRes.status}`);
  }

  const { client_id } = (await registerRes.json()) as { client_id: string };

  // 2. PKCE
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // 3. Start local callback server
  const { port, codePromise, close } = await startCallbackServer();
  const redirectUri = `http://127.0.0.1:${port}/callback`;

  // 4. Open browser
  const authorizeUrl = new URL(`${serverUrl}/oauth/authorize`);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', client_id);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  console.log('Opening browser for authentication...');
  console.log(`If browser doesn't open, visit: ${authorizeUrl.toString()}`);

  const { exec } = await import('node:child_process');
  const openCmd =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';
  exec(`${openCmd} "${authorizeUrl.toString()}"`);

  // 5. Wait for callback
  console.log('Waiting for authentication...');
  const code = await codePromise;
  close();

  // 6. Exchange code for tokens
  const tokenRes = await fetch(`${serverUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`Token exchange failed: ${tokenRes.status} ${body}`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
  };

  saveTokens({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    client_id,
    server_url: serverUrl,
  });

  console.log('Login successful!');
}

function startCallbackServer(): Promise<{
  port: number;
  codePromise: Promise<string>;
  close: () => void;
}> {
  return new Promise((resolve) => {
    let resolveCode: (code: string) => void;
    let rejectCode: (err: Error) => void;
    const codePromise = new Promise<string>((res, rej) => {
      resolveCode = res;
      rejectCode = rej;
    });

    const server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://127.0.0.1`);
      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication failed</h1><p>You can close this tab.</p>');
          rejectCode(new Error(`OAuth error: ${error}`));
          return;
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(
            '<h1>Authentication successful!</h1><p>You can close this tab.</p>',
          );
          resolveCode(code);
          return;
        }
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({
        port,
        codePromise,
        close: () => server.close(),
      });
    });
  });
}
