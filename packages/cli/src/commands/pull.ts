import type { Command } from 'commander';
import { api } from '../lib/api.js';
import { savePullState, getPullPaths } from '../lib/pull-state.js';

interface NoteDetail {
  id: string;
  title: string;
}

export function registerPullCommand(program: Command): void {
  program
    .command('pull <noteId>')
    .description('Download note to /tmp/ordinary-note/ for local editing')
    .action(async (noteId: string) => {
      // Fetch note metadata + content
      const [noteData, contentData] = await Promise.all([
        api<{ note: NoteDetail }>(`/notes/${noteId}`),
        api<{ noteId: string; markdown: string }>(`/notes/${noteId}/content`),
      ]);

      savePullState(noteId, noteData.note.title, contentData.markdown);

      const paths = getPullPaths(noteId);
      console.log(`Pulled: ${paths.md}`);
      console.log(`Original: ${paths.orig}`);
    });
}
