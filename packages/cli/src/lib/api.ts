import {
  getAccessToken,
  refreshAccessToken,
  loadTokens,
} from './auth.js';
import { getServerUrl } from './config.js';

type FetchOptions = {
  method?: string;
  body?: unknown;
  contentType?: string;
  rawBody?: string;
};

export async function api<T = unknown>(
  path: string,
  opts: FetchOptions = {},
): Promise<T> {
  const tokens = loadTokens();
  const serverUrl = tokens?.server_url ?? getServerUrl();
  const url = `${serverUrl}/api${path}`;

  const result = await fetchWithAuth(url, opts);

  if (result.status === 401) {
    // Try token refresh
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retry = await fetchWithAuth(url, opts, newToken);
      if (!retry.ok) {
        await handleError(retry);
      }
      return retry.json() as Promise<T>;
    }
    console.error('Session expired. Run: ordin login');
    return process.exit(1);
  }

  if (!result.ok) {
    await handleError(result);
  }

  return result.json() as Promise<T>;
}

export async function apiText(
  path: string,
  opts: FetchOptions = {},
): Promise<string> {
  const tokens = loadTokens();
  const serverUrl = tokens?.server_url ?? getServerUrl();
  const url = `${serverUrl}/api${path}`;

  const result = await fetchWithAuth(url, opts);

  if (result.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retry = await fetchWithAuth(url, opts, newToken);
      if (!retry.ok) {
        await handleError(retry);
      }
      return retry.text();
    }
    console.error('Session expired. Run: ordin login');
    return process.exit(1);
  }

  if (!result.ok) {
    await handleError(result);
  }

  return result.text();
}

async function fetchWithAuth(
  url: string,
  opts: FetchOptions,
  token?: string,
): Promise<Response> {
  const accessToken = token ?? getAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  let body: string | undefined;

  if (opts.rawBody !== undefined) {
    headers['Content-Type'] = opts.contentType ?? 'text/markdown';
    body = opts.rawBody;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  return fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    body,
  });
}

async function handleError(res: Response): Promise<never> {
  let message: string;
  try {
    const data = (await res.json()) as {
      error?: { message?: string; details?: unknown };
    };
    const base = data.error?.message ?? `HTTP ${res.status}`;
    const details = data.error?.details;
    message = details
      ? `${base}: ${typeof details === 'string' ? details : JSON.stringify(details)}`
      : base;
  } catch {
    message = `HTTP ${res.status}`;
  }
  console.error(`Error: ${message}`);
  return process.exit(1);
}
