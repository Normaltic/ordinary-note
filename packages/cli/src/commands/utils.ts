import fs from 'node:fs';
import type { Command } from 'commander';
import { PULL_DIR } from '../lib/config.js';
import {
  listPulledNotes,
  cleanPullDir,
  getPullPaths,
} from '../lib/pull-state.js';

export function registerUtilCommands(program: Command): void {
  program
    .command('status')
    .description('Show pull state (changed files)')
    .action(() => {
      const pulled = listPulledNotes();
      if (pulled.length === 0) {
        console.log('No pulled notes.');
        return;
      }

      for (const meta of pulled) {
        const paths = getPullPaths(meta.noteId, meta.title);
        let status = 'unchanged';

        if (fs.existsSync(paths.md) && fs.existsSync(paths.orig)) {
          const curr = fs.readFileSync(paths.md, 'utf-8');
          const orig = fs.readFileSync(paths.orig, 'utf-8');
          if (curr !== orig) status = 'modified';
        } else if (!fs.existsSync(paths.md)) {
          status = 'missing';
        }

        const marker =
          status === 'modified' ? 'M' : status === 'missing' ? '!' : ' ';
        console.log(`${marker} ${meta.noteId}  ${meta.title}  (${meta.pulledAt})`);
      }
    });

  program
    .command('clean')
    .description(`Remove all files from ${PULL_DIR}`)
    .action(() => {
      const count = cleanPullDir();
      console.log(`Cleaned ${count} files from ${PULL_DIR}`);
    });
}
