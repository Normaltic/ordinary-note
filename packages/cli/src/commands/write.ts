import type { Command } from 'commander';
import { api } from '../lib/api.js';
import { output } from '../lib/output.js';
import { assertNotOption, readMarkdownInput } from '../lib/input.js';

export function registerWriteCommand(program: Command): void {
  program
    .command('write <noteId>')
    .description('Replace note content entirely')
    .option('-f, --file <path>', 'Read content from file (use - for stdin)')
    .argument('[content]', 'Inline markdown content (may start with "- ")')
    .option('--json', 'Output as JSON')
    .allowUnknownOption()
    .action(async (noteId: string, content: string | undefined, opts: { file?: string; json?: boolean }) => {
      assertNotOption(content);
      const markdown = await readMarkdownInput(content, opts.file);
      if (markdown === null) {
        console.error('Provide content via --file or as an argument.');
        return process.exit(1);
      }

      const data = await api<{ noteId: string; replaced: boolean }>(`/notes/${noteId}/content`, {
        method: 'PUT',
        body: { markdown },
      });
      output(opts.json, data, 'Content replaced.');
    });
}
