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
    .action(async (folderId: string) => {
      const data = await api<{ notes: Note[] }>(`/folders/${folderId}/notes`);
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
    .action(async (folderId: string, opts: { title?: string }) => {
      const body: Record<string, string> = { folderId };
      if (opts.title) body.title = opts.title;

      const data = await api<{ note: Note }>('/notes', {
        method: 'POST',
        body,
      });
      console.log(`Created: ${data.note.id}  ${data.note.title || '(untitled)'}`);
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

  program
    .command('search <query>')
    .description('Search notes')
    .option('-l, --limit <n>', 'Max results', '20')
    .action(async (query: string, opts: { limit: string }) => {
      const params = new URLSearchParams({
        query,
        limit: opts.limit,
      });
      const data = await api<{ notes: Note[] }>(
        `/notes/search?${params.toString()}`,
      );
      if (data.notes.length === 0) {
        console.log('No results.');
        return;
      }
      for (const note of data.notes) {
        console.log(`${note.id}  ${note.title || '(untitled)'}`);
      }
    });
}
