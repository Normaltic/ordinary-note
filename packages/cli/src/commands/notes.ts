import fs from 'node:fs';
import type { Command } from 'commander';
import { api } from '../lib/api.js';
import { buildImportPlan, chunkNotes } from '../lib/import-plan.js';

interface BulkResult {
  folders: { path: string; id: string; created: boolean }[];
  notes: ({ index: number; id: string } | { index: number; id?: string; error: { code: string; message: string } })[];
}

// 서버 제한: 요청당 노트·폴더 100개, 본문 1MB
const BULK_MAX_ITEMS = 100;
const BULK_MAX_BYTES = 900_000;

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
    .option('-r, --recursive', 'Include notes in all subfolders (newest first, with folder path)')
    .option('--json', 'Output as JSON')
    .action(async (folderId: string, opts: { recursive?: boolean; json?: boolean }) => {
      if (opts.recursive) {
        const data = await api<{ notes: (Note & { folderPath: string | null })[] }>(
          `/folders/${folderId}/notes?recursive=true`,
        );
        if (opts.json) {
          console.log(JSON.stringify(data.notes, null, 2));
          return;
        }
        if (data.notes.length === 0) {
          console.log('No notes in this folder tree.');
          return;
        }
        for (const note of data.notes) {
          const pin = note.isPinned ? ' [pinned]' : '';
          console.log(`${note.id}  ${note.folderPath ?? ''} / ${note.title || '(untitled)'}${pin}`);
        }
        return;
      }

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
    .command('import <dir>')
    .description('Upload a local directory: subdirectories → folders, *.md → notes (title = file name)')
    .requiredOption('--to <folderId>', 'Target folder ID')
    .option('--no-wrap', 'Import directory contents directly, without a folder for the directory itself')
    .option('--dry-run', 'Show what would be created without uploading')
    .option('--json', 'Output as JSON')
    .action(async (dir: string, opts: { to: string; wrap: boolean; dryRun?: boolean; json?: boolean }) => {
      let plan: ReturnType<typeof buildImportPlan>;
      try {
        plan = buildImportPlan(dir, opts.wrap);
      } catch (e) {
        console.error(`Error: ${(e as Error).message}`);
        return process.exit(1);
      }

      if (opts.dryRun) {
        if (opts.json) {
          console.log(JSON.stringify({
            notes: plan.notes.map(({ folder, title, file }) => ({ folder, title, file })),
            emptyFolders: plan.emptyFolders,
          }, null, 2));
          return;
        }
        for (const note of plan.notes) {
          console.log(`${[...note.folder, note.title].join(' / ')}  ← ${note.file}`);
        }
        for (const folder of plan.emptyFolders) console.log(`${folder.join(' / ')} /  (empty folder)`);
        console.log(`\n${plan.notes.length} notes, ${plan.emptyFolders.length} empty folders (dry run)`);
        return;
      }

      if (plan.notes.length === 0 && plan.emptyFolders.length === 0) {
        console.log('Nothing to import.');
        return;
      }

      // 노트 청크 뒤에 빈 폴더 청크를 보낸다. 폴더는 서버가 경로로 재사용하므로 청크 간 중복 생성 없음
      const requests: { notes: typeof plan.notes; folders: string[][] }[] = chunkNotes(
        plan.notes, BULK_MAX_ITEMS, BULK_MAX_BYTES,
      ).map((notes) => ({ notes, folders: [] }));
      for (let i = 0; i < plan.emptyFolders.length; i += BULK_MAX_ITEMS) {
        requests.push({ notes: [], folders: plan.emptyFolders.slice(i, i + BULK_MAX_ITEMS) });
      }

      const createdFolders = new Set<string>();
      const created: { id: string; file: string }[] = [];
      const failed: { file: string; id?: string; error: { code: string; message: string } }[] = [];

      for (const [i, req] of requests.entries()) {
        if (!opts.json && requests.length > 1) {
          console.error(`[${i + 1}/${requests.length}] ${req.notes.length} notes, ${req.folders.length} folders`);
        }
        const res = await api<BulkResult>('/notes/bulk', {
          method: 'POST',
          body: {
            parentFolderId: opts.to,
            notes: req.notes.map(({ folder, title, content }) => ({ folder, title, content })),
            folders: req.folders,
          },
        });
        for (const f of res.folders) if (f.created) createdFolders.add(f.path);
        for (const result of res.notes) {
          const file = req.notes[result.index].file;
          if ('error' in result) failed.push({ file, id: result.id, error: result.error });
          else created.push({ id: result.id, file });
        }
      }

      if (opts.json) {
        console.log(JSON.stringify({ created, failed, foldersCreated: [...createdFolders] }, null, 2));
      } else {
        console.log(`Imported ${created.length} notes (${createdFolders.size} new folders).`);
        for (const f of failed) {
          const partial = f.id ? ` (note ${f.id} created without content)` : '';
          console.error(`  ✗ ${f.file}: ${f.error.code} ${f.error.message}${partial}`);
        }
      }
      if (failed.length > 0) process.exit(1);
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
    .option('--folder <folderId>', 'Search only within this folder and its subfolders')
    .option('--json', 'Output as JSON')
    .action(async (query: string, opts: { limit: string; folder?: string; json?: boolean }) => {
      const params = new URLSearchParams({
        query,
        limit: opts.limit,
      });
      if (opts.folder) params.set('folderId', opts.folder);
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
