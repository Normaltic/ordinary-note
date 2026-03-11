import type { Command } from 'commander';
import { api } from '../lib/api.js';

interface NoteDetail {
  id: string;
  title: string;
  folderId: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export function registerInfoCommand(program: Command): void {
  program
    .command('info <noteId>')
    .description('Show note metadata')
    .option('--json', 'Output as JSON')
    .action(async (noteId: string, opts: { json?: boolean }) => {
      const data = await api<{ note: NoteDetail }>(`/notes/${noteId}`);
      const note = data.note;

      if (opts.json) {
        console.log(JSON.stringify(note, null, 2));
        return;
      }

      console.log(`ID:        ${note.id}`);
      console.log(`Title:     ${note.title || '(untitled)'}`);
      console.log(`Folder ID: ${note.folderId}`);
      console.log(`Pinned:    ${note.isPinned}`);
      console.log(`Created:   ${note.createdAt}`);
      console.log(`Updated:   ${note.updatedAt}`);
    });
}
