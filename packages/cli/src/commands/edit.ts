import type { Command } from 'commander';
import { api } from '../lib/api.js';

export function registerEditCommand(program: Command): void {
  program
    .command('edit <noteId>')
    .description('Partially edit note content (search and replace)')
    .requiredOption('--old <text>', 'Text to find in the note')
    .requiredOption('--new <text>', 'Replacement text')
    .action(async (noteId: string, opts: { old: string; new: string }) => {
      await api(`/notes/${noteId}/content`, {
        method: 'PATCH',
        body: {
          content_updates: [
            { old_content: opts.old, new_content: opts.new },
          ],
        },
      });
      console.log('Content updated.');
    });
}
