import fs from 'node:fs';
import type { Command } from 'commander';
import { api } from '../lib/api.js';

interface Note {
  id: string;
  title: string;
  folderId: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export function registerNoteCommands(program: Command): void {
  const cmd = program.command('notes').description('Manage notes');

  cmd
    .command('ls <folderId>')
    .description('List notes in a folder')
    .option('--json', 'Output as JSON')
    .action(async (folderId: string, opts: { json?: boolean }) => {
      const data = await api<{ notes: Note[] }>(`/folders/${folderId}/children`);
      if (opts.json) {
        console.log(JSON.stringify(data.notes, null, 2));
        return;
      }
      if (data.notes.length === 0) {
        console.log('No notes in this folder.');
        return;
      }
      for (const note of data.notes) {
        const pin = note.isPinned ? ' [pinned]' : '';
        console.log(`${note.id}  ${note.title || '(untitled)'}${pin}`);
      }
    });

  cmd
    .command('create <folderId>')
    .description('Create a new note')
    .option('-t, --title <title>', 'Note title')
    .option('-f, --file <path>', 'Initial content from file')
    .action(async (folderId: string, opts: { title?: string; file?: string }) => {
      const body: Record<string, string> = { folderId };
      if (opts.title) body.title = opts.title;

      const data = await api<{ note: Note }>('/notes', {
        method: 'POST',
        body,
      });
      console.log(`Created: ${data.note.id}  ${data.note.title || '(untitled)'}`);

      if (opts.file) {
        const markdown = fs.readFileSync(opts.file, 'utf-8');
        await api(`/notes/${data.note.id}/content`, {
          method: 'PUT',
          body: { markdown },
        });
        console.log('Content uploaded.');
      }
    });

  cmd
    .command('mv <noteId> <folderId>')
    .description('Move note to another folder')
    .action(async (noteId: string, folderId: string) => {
      await api(`/notes/${noteId}`, {
        method: 'PATCH',
        body: { folderId },
      });
      console.log('Moved.');
    });

  cmd
    .command('rename <noteId> <title>')
    .description('Rename a note')
    .action(async (noteId: string, title: string) => {
      await api(`/notes/${noteId}`, {
        method: 'PATCH',
        body: { title },
      });
      console.log(`Renamed to: ${title}`);
    });

  cmd
    .command('rm <noteId>')
    .description('Delete a note')
    .action(async (noteId: string) => {
      await api(`/notes/${noteId}`, { method: 'DELETE' });
      console.log('Deleted.');
    });

  cmd
    .command('trash')
    .description('List deleted notes (trash)')
    .option('-l, --limit <n>', 'Max results', '50')
    .option('--json', 'Output as JSON')
    .action(async (opts: { limit: string; json?: boolean }) => {
      const params = new URLSearchParams({ limit: opts.limit });
      const data = await api<{ notes: (Note & { folderName?: string | null; deletedAt: string })[] }>(
        `/notes/deleted?${params.toString()}`,
      );
      if (opts.json) {
        console.log(JSON.stringify(data.notes, null, 2));
        return;
      }
      if (data.notes.length === 0) {
        console.log('Trash is empty.');
        return;
      }
      for (const note of data.notes) {
        const date = new Date(note.deletedAt).toLocaleDateString();
        const folder = note.folderName ? ` [${note.folderName}]` : '';
        console.log(`${note.id}  ${note.title || '(untitled)'}${folder}  deleted ${date}`);
      }
    });

  cmd
    .command('restore <noteId>')
    .description('Restore a deleted note from trash')
    .action(async (noteId: string) => {
      const data = await api<{ note: Note }>(`/notes/${noteId}/restore`, {
        method: 'PATCH',
      });
      console.log(`Restored: ${data.note.id}  ${data.note.title || '(untitled)'}`);
    });

  cmd
    .command('purge <noteId>')
    .description('Permanently delete a note from trash')
    .action(async (noteId: string) => {
      await api(`/notes/${noteId}/permanent`, { method: 'DELETE' });
      console.log('Permanently deleted.');
    });

  cmd
    .command('empty-trash')
    .description('Permanently delete all notes in trash')
    .action(async () => {
      await api('/notes/trash', { method: 'DELETE' });
      console.log('Trash emptied.');
    });

  program
    .command('search <query>')
    .description('Search notes')
    .option('-l, --limit <n>', 'Max results', '20')
    .option('--json', 'Output as JSON')
    .action(async (query: string, opts: { limit: string; json?: boolean }) => {
      const params = new URLSearchParams({
        query,
        limit: opts.limit,
      });
      const data = await api<{ notes: (Note & { folderName?: string | null })[] }>(
        `/notes/search?${params.toString()}`,
      );
      if (opts.json) {
        console.log(JSON.stringify(data.notes, null, 2));
        return;
      }
      if (data.notes.length === 0) {
        console.log('No results.');
        return;
      }
      for (const note of data.notes) {
        const folder = note.folderName ? ` [${note.folderName}]` : '';
        console.log(`${note.id}  ${note.title || '(untitled)'}${folder}`);
      }
    });
}
