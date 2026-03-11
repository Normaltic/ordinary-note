import path from 'node:path';
import os from 'node:os';

export const CONFIG_DIR = path.join(os.homedir(), '.ordinary-note');
export const AUTH_FILE = path.join(CONFIG_DIR, 'auth.json');
export const PULL_DIR = '/tmp/ordinary-note';

export function getServerUrl(): string {
  return process.env.ORDIN_SERVER_URL ?? 'http://localhost:3001';
}
