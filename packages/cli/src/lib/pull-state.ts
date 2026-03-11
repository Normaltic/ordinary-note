import fs from 'node:fs';
import path from 'node:path';
import { PULL_DIR, getServerUrl } from './config.js';
import { loadTokens } from './auth.js';

interface PullMeta {
  noteId: string;
  title: string;
  pulledAt: string;
  serverUrl: string;
}

export function getPullPaths(noteId: string) {
  return {
    dir: PULL_DIR,
    md: path.join(PULL_DIR, `${noteId}.md`),
    orig: path.join(PULL_DIR, `${noteId}.orig.md`),
    meta: path.join(PULL_DIR, `${noteId}.meta.json`),
  };
}

export function savePullState(
  noteId: string,
  title: string,
  markdown: string,
): void {
  const paths = getPullPaths(noteId);
  fs.mkdirSync(paths.dir, { recursive: true });
  fs.writeFileSync(paths.md, markdown);
  fs.writeFileSync(paths.orig, markdown);
  fs.chmodSync(paths.orig, 0o444);

  const tokens = loadTokens();
  const meta: PullMeta = {
    noteId,
    title,
    pulledAt: new Date().toISOString(),
    serverUrl: tokens?.server_url ?? getServerUrl(),
  };
  fs.writeFileSync(paths.meta, JSON.stringify(meta, null, 2));
}

export function loadPullMeta(noteId: string): PullMeta | null {
  const paths = getPullPaths(noteId);
  try {
    const data = fs.readFileSync(paths.meta, 'utf-8');
    return JSON.parse(data) as PullMeta;
  } catch {
    return null;
  }
}

export function listPulledNotes(): PullMeta[] {
  if (!fs.existsSync(PULL_DIR)) return [];

  const files = fs.readdirSync(PULL_DIR).filter((f) => f.endsWith('.meta.json'));
  const metas: PullMeta[] = [];

  for (const file of files) {
    try {
      const data = fs.readFileSync(path.join(PULL_DIR, file), 'utf-8');
      metas.push(JSON.parse(data) as PullMeta);
    } catch {
      // skip corrupted meta files
    }
  }

  return metas;
}

export function cleanPullDir(): number {
  if (!fs.existsSync(PULL_DIR)) return 0;

  const files = fs.readdirSync(PULL_DIR);
  for (const file of files) {
    const fullPath = path.join(PULL_DIR, file);
    // Make writable before deleting (orig files are read-only)
    try {
      fs.chmodSync(fullPath, 0o644);
    } catch {
      // ignore
    }
    fs.unlinkSync(fullPath);
  }
  return files.length;
}

