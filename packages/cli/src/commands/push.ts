import fs from 'node:fs';
import type { Command } from 'commander';
import { api } from '../lib/api.js';
import {
  getPullPaths,
  loadPullMeta,
  listPulledNotes,
  savePullState,
} from '../lib/pull-state.js';

export function registerPushCommand(program: Command): void {
  program
    .command('push [noteId]')
    .description('Push local changes back to server')
    .option('--full', 'Replace entire content (PUT) instead of diff-based PATCH')
    .action(async (inputNoteId: string | undefined, opts: { full?: boolean }) => {
      let noteId = inputNoteId;

      // Auto-detect noteId if not provided
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

      const currentContent = fs.readFileSync(paths.md, 'utf-8');

      if (opts.full) {
        // Full replace via PUT
        await api(`/notes/${noteId}/content`, {
          method: 'PUT',
          body: { markdown: currentContent },
        });
        console.log('Content replaced (full).');
      } else {
        // Diff-based PATCH
        const origContent = fs.existsSync(paths.orig)
          ? fs.readFileSync(paths.orig, 'utf-8')
          : '';

        if (currentContent === origContent) {
          console.log('No changes detected.');
          return;
        }

        const updates = buildContentUpdates(origContent, currentContent);

        if (updates.length === 0) {
          console.log('No changes detected.');
          return;
        }

        await api(`/notes/${noteId}/content`, {
          method: 'PATCH',
          body: { content_updates: updates },
        });
        console.log('Content updated (diff).');
      }

      // Update orig snapshot after successful push
      savePullState(noteId, meta.title, currentContent);
    });
}

interface ContentUpdate {
  old_content: string;
  new_content: string;
}

function buildContentUpdates(
  orig: string,
  current: string,
): ContentUpdate[] {
  const origBlocks = splitBlocks(orig);
  const currBlocks = splitBlocks(current);

  if (orig.trim() === '') {
    return [{ old_content: '', new_content: current.trim() }];
  }

  let firstDiff = 0;
  const minLen = Math.min(origBlocks.length, currBlocks.length);

  while (firstDiff < minLen && origBlocks[firstDiff] === currBlocks[firstDiff]) {
    firstDiff++;
  }

  if (firstDiff === minLen && origBlocks.length === currBlocks.length) {
    return [];
  }

  let lastOrigDiff = origBlocks.length - 1;
  let lastCurrDiff = currBlocks.length - 1;

  while (
    lastOrigDiff > firstDiff &&
    lastCurrDiff > firstDiff &&
    origBlocks[lastOrigDiff] === currBlocks[lastCurrDiff]
  ) {
    lastOrigDiff--;
    lastCurrDiff--;
  }

  const oldContent = origBlocks.slice(firstDiff, lastOrigDiff + 1).join('\n\n');
  const newContent = currBlocks.slice(firstDiff, lastCurrDiff + 1).join('\n\n');

  return [{ old_content: oldContent, new_content: newContent }];
}

function splitBlocks(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split(/\n\n/);
}
