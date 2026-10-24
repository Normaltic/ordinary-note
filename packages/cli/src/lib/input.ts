import fs from 'node:fs';

/**
 * 인라인 content가 옵션 오타(-x, --xxx)처럼 보이면 거부한다.
 * 마크다운 리스트("- item")·구분선("---")은 허용하기 위해 명령에 allowUnknownOption을 켜므로 필요.
 */
export function assertNotOption(content: string | undefined): void {
  if (content && /^--?[a-zA-Z]/.test(content)) {
    console.error(`error: unknown option '${content}'`);
    process.exit(1);
  }
}

/** --file(경로 또는 - 로 stdin) 또는 인라인 인자에서 마크다운을 읽는다. 둘 다 없으면 null */
export async function readMarkdownInput(
  content: string | undefined,
  file: string | undefined,
): Promise<string | null> {
  if (file) {
    return file === '-' ? readStdin() : fs.readFileSync(file, 'utf-8');
  }
  return content ?? null;
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    process.stdin.on('error', reject);
  });
}
