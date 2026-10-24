import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildImportPlan, chunkNotes } from './import-plan.js';

describe('buildImportPlan', () => {
  let root: string;

  const write = (rel: string, content = '') => {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  };

  beforeEach(() => {
    root = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ordin-import-')), '과업');
    fs.mkdirSync(root);
    write('개요.md', '# 개요');
    write('S10 배포/회고.md', '회고');
    write('S2 설계/노트.markdown', '노트');
    write('S2 설계/이미지.png');
    write('.hidden/숨김.md');
    write('node_modules/pkg/readme.md');
    fs.mkdirSync(path.join(root, '빈 폴더/더 빈 폴더'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(path.dirname(root), { recursive: true, force: true });
  });

  it('wrap이면 디렉터리 자신을 최상위 폴더로 만든다', () => {
    const plan = buildImportPlan(root, true);

    expect(plan.notes.map((n) => [...n.folder, n.title].join('/')).sort()).toEqual(
      ['과업/S10 배포/회고', '과업/S2 설계/노트', '과업/개요'].sort(),
    );
    expect(plan.notes.find((n) => n.title === '개요')?.content).toBe('# 개요');
  });

  it('--no-wrap이면 내용만 가져오고, 숫자 인식 정렬(S2 < S10)', () => {
    const plan = buildImportPlan(root, false);

    const folders = plan.notes.map((n) => n.folder.join('/'));
    expect(folders).toContain('');
    expect(folders.indexOf('S2 설계')).toBeLessThan(folders.indexOf('S10 배포'));
    expect(plan.notes.find((n) => n.title === '노트')?.file).toBe(path.join('S2 설계', '노트.markdown'));
  });

  it('숨김·node_modules·비마크다운 파일은 제외한다', () => {
    const plan = buildImportPlan(root, false);
    const files = plan.notes.map((n) => n.file).join(',');

    expect(files).not.toMatch(/숨김|readme|이미지/);
  });

  it('빈 경로·없는 경로·파일이면 에러', () => {
    expect(() => buildImportPlan('', false)).toThrow('Not a directory');
    expect(() => buildImportPlan(path.join(root, 'nope'), false)).toThrow('Not a directory');
    expect(() => buildImportPlan(path.join(root, '개요.md'), false)).toThrow('Not a directory');
  });

  it('마크다운이 없는 디렉터리는 빈 폴더로 포함한다', () => {
    const plan = buildImportPlan(root, false);

    expect(plan.emptyFolders).toEqual([['빈 폴더'], ['빈 폴더', '더 빈 폴더']]);
  });
});

describe('chunkNotes', () => {
  const note = (content: string) => ({ folder: [], title: 't', content });

  it('개수 제한으로 나눈다', () => {
    const chunks = chunkNotes(Array.from({ length: 5 }, () => note('x')), 2, 1_000_000);
    expect(chunks.map((c) => c.length)).toEqual([2, 2, 1]);
  });

  it('바이트 제한으로 나누고, 단일 항목이 커도 혼자 한 청크로 보낸다', () => {
    const chunks = chunkNotes([note('a'.repeat(50)), note('b'.repeat(50)), note('c'.repeat(500))], 100, 120);
    expect(chunks.map((c) => c.length)).toEqual([1, 1, 1]);
  });
});
