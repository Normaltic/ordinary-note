import fs from 'node:fs';
import path from 'node:path';

export interface ImportNote {
  /** 기준 폴더로부터의 상대 폴더 경로 */
  folder: string[];
  title: string;
  content: string;
  /** 원본 파일 경로 (결과 보고용) */
  file: string;
}

export interface ImportPlan {
  notes: ImportNote[];
  /** 마크다운 파일이 없는 폴더 */
  emptyFolders: string[][];
}

const MARKDOWN_EXT = /\.(md|markdown)$/i;
const SKIP_DIRS = new Set(['node_modules']);

/**
 * 디렉터리를 폴더/노트 업로드 계획으로 변환한다.
 * 하위 디렉터리 → 폴더, *.md → 노트(제목 = 확장자 뺀 파일명). 숨김 파일·디렉터리는 제외.
 * @param wrap true면 디렉터리 자신을 최상위 폴더로 만든다 (cp -r 과 동일)
 */
export function buildImportPlan(dir: string, wrap: boolean): ImportPlan {
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error(`Not a directory: '${dir}'`);
  }
  const root = path.resolve(dir);
  const base = wrap ? [path.basename(root)] : [];
  const notes: ImportNote[] = [];
  const dirs: string[][] = wrap ? [base] : [];

  const walk = (current: string, folder: string[]) => {
    const entries = fs
      .readdirSync(current, { withFileTypes: true })
      .filter((e) => !e.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const sub = [...folder, entry.name];
        dirs.push(sub);
        walk(full, sub);
      } else if (entry.isFile() && MARKDOWN_EXT.test(entry.name)) {
        notes.push({
          folder,
          title: entry.name.replace(MARKDOWN_EXT, ''),
          content: fs.readFileSync(full, 'utf-8'),
          file: path.relative(root, full),
        });
      }
    }
  };
  walk(root, base);

  const used = notes.map((n) => n.folder.join('/'));
  const emptyFolders = dirs.filter((d) => {
    const key = d.join('/');
    return !used.some((u) => u === key || u.startsWith(`${key}/`));
  });

  return { notes, emptyFolders };
}

/** 요청 크기 제한(개수·바이트)에 맞춰 노트를 순서대로 나눈다 */
export function chunkNotes<T extends { content: string; title: string; folder: string[] }>(
  notes: T[],
  maxCount: number,
  maxBytes: number,
): T[][] {
  const chunks: T[][] = [];
  let current: T[] = [];
  let bytes = 0;

  for (const note of notes) {
    const size = Buffer.byteLength(JSON.stringify(note), 'utf-8');
    if (current.length > 0 && (current.length >= maxCount || bytes + size > maxBytes)) {
      chunks.push(current);
      current = [];
      bytes = 0;
    }
    current.push(note);
    bytes += size;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}
