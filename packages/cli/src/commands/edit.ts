import fs from 'node:fs';
import type { Command } from 'commander';
import { api } from '../lib/api.js';

interface ContentUpdate {
  old_content: string;
  new_content: string;
}

export function registerEditCommand(program: Command): void {
  program
    .command('edit <noteId>')
    .description('Partially edit note content (search and replace)')
    .option('--old <text>', 'Text to find in the note')
    .option('--new <text>', 'Replacement text')
    .option('--updates-file <path>', 'JSON file with [{old_content, new_content}] array')
    .action(async (noteId: string, opts: { old?: string; new?: string; updatesFile?: string }) => {
      let updates: ContentUpdate[];

      if (opts.updatesFile) {
        const raw = fs.readFileSync(opts.updatesFile, 'utf-8');
        updates = JSON.parse(raw) as ContentUpdate[];
      } else if (opts.old !== undefined && opts.new !== undefined) {
        updates = [{ old_content: opts.old, new_content: opts.new }];
      } else {
        console.error('Provide --old and --new, or --updates-file.');
        return process.exit(1);
      }

      await api(`/notes/${noteId}/content`, {
        method: 'PATCH',
        body: { content_updates: updates },
      });
      console.log(`Content updated (${updates.length} edit${updates.length > 1 ? 's' : ''}).`);
    });
}
