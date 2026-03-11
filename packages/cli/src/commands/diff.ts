import fs from 'node:fs';
import type { Command } from 'commander';
import {
  listPulledNotes,
  loadPullMeta,
  getPullPaths,
} from '../lib/pull-state.js';

export function registerDiffCommand(program: Command): void {
  program
    .command('diff [noteId]')
    .description('Show local changes for a pulled note')
    .action((inputNoteId?: string) => {
      let noteId = inputNoteId;

      if (!noteId) {
        const pulled = listPulledNotes();
        if (pulled.length === 0) {
          console.error('No pulled notes found. Run: ordin pull <noteId>');
          return process.exit(1);
        }
        if (pulled.length === 1) {
          noteId = pulled[0].noteId;
        } else {
          console.error('Multiple pulled notes. Specify a noteId:');
          for (const m of pulled) {
            console.error(`  ${m.noteId}  ${m.title}`);
          }
          return process.exit(1);
        }
      }

      const meta = loadPullMeta(noteId);
      if (!meta) {
        console.error(`Note ${noteId} not pulled. Run: ordin pull ${noteId}`);
        return process.exit(1);
      }

      const paths = getPullPaths(noteId, meta.title);

      if (!fs.existsSync(paths.md)) {
        console.error(`File not found: ${paths.md}`);
        return process.exit(1);
      }

      const origLines = fs.existsSync(paths.orig)
        ? fs.readFileSync(paths.orig, 'utf-8').split('\n')
        : [];
      const currLines = fs.readFileSync(paths.md, 'utf-8').split('\n');

      const diff = simpleDiff(origLines, currLines);
      if (diff.length === 0) {
        console.log('No changes.');
        return;
      }

      console.log(`--- ${paths.orig}`);
      console.log(`+++ ${paths.md}`);
      for (const line of diff) {
        console.log(line);
      }
    });
}

function simpleDiff(origLines: string[], currLines: string[]): string[] {
  const output: string[] = [];
  const maxLen = Math.max(origLines.length, currLines.length);

  let i = 0;
  while (i < maxLen) {
    if (i >= origLines.length) {
      output.push(`+${currLines[i]}`);
      i++;
    } else if (i >= currLines.length) {
      output.push(`-${origLines[i]}`);
      i++;
    } else if (origLines[i] !== currLines[i]) {
      output.push(`-${origLines[i]}`);
      output.push(`+${currLines[i]}`);
      i++;
    } else {
      i++;
    }
  }

  return output;
}
