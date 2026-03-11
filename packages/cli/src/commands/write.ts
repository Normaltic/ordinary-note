import fs from 'node:fs';
import type { Command } from 'commander';
import { api } from '../lib/api.js';

export function registerWriteCommand(program: Command): void {
  program
    .command('write <noteId>')
    .description('Replace note content entirely')
    .option('-f, --file <path>', 'Read content from file (use - for stdin)')
    .argument('[content]', 'Inline markdown content')
    .action(async (noteId: string, content: string | undefined, opts: { file?: string }) => {
      let markdown: string;

      if (opts.file) {
        if (opts.file === '-') {
          markdown = await readStdin();
        } else {
          markdown = fs.readFileSync(opts.file, 'utf-8');
        }
      } else if (content) {
        markdown = content;
      } else {
        console.error('Provide content via --file or as an argument.');
        return process.exit(1);
      }

      await api(`/notes/${noteId}/content`, {
        method: 'PUT',
        body: { markdown },
      });
      console.log('Content replaced.');
    });
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    process.stdin.on('error', reject);
  });
}
