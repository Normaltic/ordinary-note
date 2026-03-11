import type { Command } from 'commander';
import { api } from '../lib/api.js';

export function registerReadCommand(program: Command): void {
  program
    .command('read <noteId>')
    .description('Read note content (markdown to stdout)')
    .action(async (noteId: string) => {
      const data = await api<{ noteId: string; markdown: string }>(
        `/notes/${noteId}/content`,
      );
      process.stdout.write(data.markdown);
      // Add trailing newline if content doesn't end with one
      if (data.markdown && !data.markdown.endsWith('\n')) {
        process.stdout.write('\n');
      }
    });
}
