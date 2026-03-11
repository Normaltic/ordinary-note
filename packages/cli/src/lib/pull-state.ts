import fs from 'node:fs';
import path from 'node:path';
import { PULL_DIR, getServerUrl } from './config.js';
import { loadTokens } from './auth.js';

interface PullMeta {
  noteId: string;
  title: string;
  filePrefix: string;
  pulledAt: string;
  serverUrl: string;
}

export function sanitizeTitle(title: string): string {
  if (!title.trim()) return 'untitled';
  return title
    .replace(/[<>:"/\\|?*\p{Cc}]/gu, '')
    .replace(/\s+/g, '_')
    .slice(0, 50)
    .replace(/_+$/, '') || 'untitled';
}

export function getPullPaths(noteId: string, title?: string) {
  const prefix = title !== undefined ? sanitizeTitle(title) : 'untitled';
  const base = `${prefix}_${noteId}`;
  return {
    dir: PULL_DIR,
    md: path.join(PULL_DIR, `${base}.md`),
    orig: path.join(PULL_DIR, `${base}.orig.md`),
    meta: path.join(PULL_DIR, `${noteId}.meta.json`),
  };
}

export function savePullState(
  noteId: string,
  title: string,
  markdown: string,
): void {
  const newPrefix = sanitizeTitle(title);
  const paths = getPullPaths(noteId, title);
  fs.mkdirSync(paths.dir, { recursive: true });

  // Remove old files if prefix changed
  const oldMeta = loadPullMeta(noteId);
  if (oldMeta && oldMeta.filePrefix !== newPrefix) {
    const oldPaths = getPullPaths(noteId, oldMeta.title);
    for (const f of [oldPaths.md, oldPaths.orig]) {
      try {
        fs.chmodSync(f, 0o644);
        fs.unlinkSync(f);
      } catch {
        // ignore
      }
    }
  }

  fs.writeFileSync(paths.md, markdown);
  // Make orig writable first if it exists
  try { fs.chmodSync(paths.orig, 0o644); } catch { /* ignore */ }
  fs.writeFileSync(paths.orig, markdown);
  fs.chmodSync(paths.orig, 0o444);

  const tokens = loadTokens();
  const meta: PullMeta = {
    noteId,
    title,
    filePrefix: newPrefix,
    pulledAt: new Date().toISOString(),
    serverUrl: tokens?.server_url ?? getServerUrl(),
  };
  fs.writeFileSync(paths.meta, JSON.stringify(meta, null, 2));
}

export function loadPullMeta(noteId: string): PullMeta | null {
  const metaPath = path.join(PULL_DIR, `${noteId}.meta.json`);
  try {
    const data = fs.readFileSync(metaPath, 'utf-8');
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
    try {
      fs.chmodSync(fullPath, 0o644);
    } catch {
      // ignore
    }
    fs.unlinkSync(fullPath);
  }
  return files.length;
}
