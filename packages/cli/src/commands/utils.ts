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
    .option('--json', 'Output as JSON')
    .action((opts: { json?: boolean }) => {
      const pulled = listPulledNotes();
      if (pulled.length === 0) {
        if (opts.json) {
          console.log('[]');
        } else {
          console.log('No pulled notes.');
        }
        return;
      }

      const results: Array<{
        noteId: string;
        title: string;
        status: string;
        pulledAt: string;
        added?: number;
        removed?: number;
      }> = [];

      for (const meta of pulled) {
        const paths = getPullPaths(meta.noteId, meta.title);
        let status = 'unchanged';
        let added = 0;
        let removed = 0;

        if (fs.existsSync(paths.md) && fs.existsSync(paths.orig)) {
          const curr = fs.readFileSync(paths.md, 'utf-8');
          const orig = fs.readFileSync(paths.orig, 'utf-8');
          if (curr !== orig) {
            status = 'modified';
            const origLines = orig.split('\n');
            const currLines = curr.split('\n');
            const maxLen = Math.max(origLines.length, currLines.length);
            for (let i = 0; i < maxLen; i++) {
              if (i >= origLines.length) added++;
              else if (i >= currLines.length) removed++;
              else if (origLines[i] !== currLines[i]) { added++; removed++; }
            }
          }
        } else if (!fs.existsSync(paths.md)) {
          status = 'missing';
        }

        results.push({
          noteId: meta.noteId,
          title: meta.title,
          status,
          pulledAt: meta.pulledAt,
          ...(status === 'modified' ? { added, removed } : {}),
        });
      }

      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      for (const r of results) {
        const marker =
          r.status === 'modified' ? 'M' : r.status === 'missing' ? '!' : ' ';
        const diffSummary =
          r.status === 'modified' ? ` (+${r.added} -${r.removed})` : '';
        console.log(`${marker} ${r.noteId}  ${r.title}  (${r.pulledAt})${diffSummary}`);
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
