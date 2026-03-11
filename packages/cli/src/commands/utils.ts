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

        let diffSummary = '';

        if (fs.existsSync(paths.md) && fs.existsSync(paths.orig)) {
          const curr = fs.readFileSync(paths.md, 'utf-8');
          const orig = fs.readFileSync(paths.orig, 'utf-8');
          if (curr !== orig) {
            status = 'modified';
            const origLines = orig.split('\n');
            const currLines = curr.split('\n');
            let added = 0;
            let removed = 0;
            const maxLen = Math.max(origLines.length, currLines.length);
            for (let i = 0; i < maxLen; i++) {
              if (i >= origLines.length) added++;
              else if (i >= currLines.length) removed++;
              else if (origLines[i] !== currLines[i]) { added++; removed++; }
            }
            diffSummary = ` (+${added} -${removed})`;
          }
        } else if (!fs.existsSync(paths.md)) {
          status = 'missing';
        }

        const marker =
          status === 'modified' ? 'M' : status === 'missing' ? '!' : ' ';
        console.log(`${marker} ${meta.noteId}  ${meta.title}  (${meta.pulledAt})${diffSummary}`);
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
