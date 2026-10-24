import type { Command } from 'commander';
import { api } from '../lib/api.js';
import { output } from '../lib/output.js';

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  noteCount?: number;
  children?: Folder[];
}

export function registerFolderCommands(program: Command): void {
  const cmd = program.command('folders').description('Manage folders');

  cmd
    .command('ls')
    .description('List folder tree')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      const data = await api<{ folders: Folder[] }>('/folders');
      if (opts.json) {
        console.log(JSON.stringify(data.folders, null, 2));
        return;
      }
      printFolderTree(data.folders, 0);
    });

  cmd
    .command('create <name>')
    .description('Create a new folder')
    .option('-p, --parent <parentId>', 'Parent folder ID')
    .option('--json', 'Output as JSON')
    .action(async (name: string, opts: { parent?: string; json?: boolean }) => {
      const body: Record<string, string> = { name };
      if (opts.parent) body.parentId = opts.parent;

      const data = await api<{ folder: Folder }>('/folders', {
        method: 'POST',
        body,
      });
      output(opts.json, data.folder, `Created: ${data.folder.id}  ${data.folder.name}`);
    });

  cmd
    .command('mv <folderId> <parentId>')
    .description('Move folder to a new parent (use "root" for top-level)')
    .option('--json', 'Output as JSON')
    .action(async (folderId: string, parentId: string, opts: { json?: boolean }) => {
      const body = { parentId: parentId === 'root' ? null : parentId };
      const data = await api<{ folder: Folder }>(`/folders/${folderId}`, { method: 'PATCH', body });
      output(opts.json, data.folder, 'Moved.');
    });

  cmd
    .command('rename <folderId> <name>')
    .description('Rename a folder')
    .option('--json', 'Output as JSON')
    .action(async (folderId: string, name: string, opts: { json?: boolean }) => {
      const data = await api<{ folder: Folder }>(`/folders/${folderId}`, {
        method: 'PATCH',
        body: { name },
      });
      output(opts.json, data.folder, `Renamed to: ${name}`);
    });

  cmd
    .command('rm <folderId>')
    .description('Delete a folder and its subfolders (notes move to trash)')
    .option('--json', 'Output as JSON')
    .action(async (folderId: string, opts: { json?: boolean }) => {
      const data = await api<{ id: string }>(`/folders/${folderId}`, { method: 'DELETE' });
      output(opts.json, data, 'Deleted.');
    });
}

function printFolderTree(folders: Folder[], depth: number): void {
  for (const folder of folders) {
    const indent = '  '.repeat(depth);
    const count = folder.noteCount ? ` [${folder.noteCount} notes]` : '';
    console.log(`${indent}${folder.name}  (${folder.id})${count}`);
    if (folder.children && folder.children.length > 0) {
      printFolderTree(folder.children, depth + 1);
    }
  }
}
