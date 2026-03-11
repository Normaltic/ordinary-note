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
    .option('--force', 'Skip server conflict check')
    .action(async (inputNoteId: string | undefined, opts: { full?: boolean; force?: boolean }) => {
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
      const origContent = fs.existsSync(paths.orig)
        ? fs.readFileSync(paths.orig, 'utf-8')
        : '';

      // Conflict detection
      if (!opts.force) {
        const serverData = await api<{ noteId: string; markdown: string }>(
          `/notes/${noteId}/content`,
        );
        if (serverData.markdown !== origContent) {
          console.error('Conflict: server content has changed since last pull.');
          console.error('Run: ordin pull to update, or use --force to overwrite.');
          return process.exit(1);
        }
      }

      if (opts.full) {
        // Full replace via PUT
        await api(`/notes/${noteId}/content`, {
          method: 'PUT',
          body: { markdown: currentContent },
        });
        console.log('Content replaced (full).');
      } else {
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
        console.log(`Content updated (${updates.length} diff${updates.length > 1 ? 's' : ''}).`);
      }

      // Update orig snapshot after successful push
      savePullState(noteId, meta.title, currentContent);
    });
}

interface ContentUpdate {
  old_content: string;
  new_content: string;
}

export function buildContentUpdates(
  orig: string,
  current: string,
): ContentUpdate[] {
  const origBlocks = splitBlocks(orig);
  const currBlocks = splitBlocks(current);

  if (orig.trim() === '') {
    return [{ old_content: '', new_content: current.trim() }];
  }

  // Trim matching blocks from front
  let firstDiff = 0;
  const minLen = Math.min(origBlocks.length, currBlocks.length);

  while (firstDiff < minLen && origBlocks[firstDiff] === currBlocks[firstDiff]) {
    firstDiff++;
  }

  if (firstDiff === minLen && origBlocks.length === currBlocks.length) {
    return [];
  }

  // Trim matching blocks from end
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

  // Extract diff segments
  const diffOrig = origBlocks.slice(firstDiff, lastOrigDiff + 1);
  const diffCurr = currBlocks.slice(firstDiff, lastCurrDiff + 1);

  // Find common blocks within diff segment to split into multiple updates
  return splitByCommonBlocks(diffOrig, diffCurr);
}

function splitByCommonBlocks(
  origSegment: string[],
  currSegment: string[],
): ContentUpdate[] {
  // Build set of blocks in orig for fast lookup
  const origSet = new Set(origSegment);

  // Find split points: blocks in currSegment that also appear in origSegment
  // at roughly corresponding positions
  const updates: ContentUpdate[] = [];
  let origIdx = 0;
  let currIdx = 0;

  while (origIdx < origSegment.length || currIdx < currSegment.length) {
    // Find next common block
    let foundOrig = -1;
    let foundCurr = -1;

    for (let ci = currIdx; ci < currSegment.length; ci++) {
      if (!origSet.has(currSegment[ci])) continue;
      // Find this block in remaining orig
      for (let oi = origIdx; oi < origSegment.length; oi++) {
        if (origSegment[oi] === currSegment[ci]) {
          foundOrig = oi;
          foundCurr = ci;
          break;
        }
      }
      if (foundOrig !== -1) break;
    }

    if (foundOrig === -1) {
      // No more common blocks — emit rest as single update
      const old = origSegment.slice(origIdx).join('\n\n');
      const nw = currSegment.slice(currIdx).join('\n\n');
      if (old || nw) {
        updates.push({ old_content: old, new_content: nw });
      }
      break;
    }

    // Emit the differing part before the common block
    const oldBefore = origSegment.slice(origIdx, foundOrig).join('\n\n');
    const newBefore = currSegment.slice(currIdx, foundCurr).join('\n\n');
    if (oldBefore || newBefore) {
      updates.push({ old_content: oldBefore, new_content: newBefore });
    }

    // Skip the common block
    origIdx = foundOrig + 1;
    currIdx = foundCurr + 1;
  }

  return updates;
}

function splitBlocks(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split(/\n\n/);
}
