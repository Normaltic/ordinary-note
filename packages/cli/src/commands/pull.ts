import type { Command } from 'commander';
import { api } from '../lib/api.js';
import { savePullState, getPullPaths } from '../lib/pull-state.js';

interface NoteDetail {
  id: string;
  title: string;
}

export function registerPullCommand(program: Command): void {
  program
    .command('pull <noteIds...>')
    .description('Download note(s) to /tmp/ordinary-note/ for local editing')
    .action(async (noteIds: string[]) => {
      for (const noteId of noteIds) {
        const [noteData, contentData] = await Promise.all([
          api<{ note: NoteDetail }>(`/notes/${noteId}`),
          api<{ noteId: string; markdown: string }>(`/notes/${noteId}/content`),
        ]);

        const title = noteData.note.title;
        savePullState(noteId, title, contentData.markdown);

        const paths = getPullPaths(noteId, title);
        console.log(`Pulled: ${paths.md}`);
      }
    });
}
