import type { Command } from 'commander';
import { api } from '../lib/api.js';

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
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
    .action(async (name: string, opts: { parent?: string }) => {
      const body: Record<string, string> = { name };
      if (opts.parent) body.parentId = opts.parent;

      const data = await api<{ folder: Folder }>('/folders', {
        method: 'POST',
        body,
      });
      console.log(`Created: ${data.folder.id}  ${data.folder.name}`);
    });

  cmd
    .command('mv <folderId> <parentId>')
    .description('Move folder to a new parent (use "root" for top-level)')
    .action(async (folderId: string, parentId: string) => {
      const body = { parentId: parentId === 'root' ? null : parentId };
      await api(`/folders/${folderId}`, { method: 'PATCH', body });
      console.log('Moved.');
    });

  cmd
    .command('rename <folderId> <name>')
    .description('Rename a folder')
    .action(async (folderId: string, name: string) => {
      await api(`/folders/${folderId}`, {
        method: 'PATCH',
        body: { name },
      });
      console.log(`Renamed to: ${name}`);
    });

  cmd
    .command('rm <folderId>')
    .description('Delete a folder')
    .action(async (folderId: string) => {
      await api(`/folders/${folderId}`, { method: 'DELETE' });
      console.log('Deleted.');
    });
}

function printFolderTree(folders: Folder[], depth: number): void {
  for (const folder of folders) {
    const indent = '  '.repeat(depth);
    console.log(`${indent}${folder.name}  (${folder.id})`);
    if (folder.children && folder.children.length > 0) {
      printFolderTree(folder.children, depth + 1);
    }
  }
}
