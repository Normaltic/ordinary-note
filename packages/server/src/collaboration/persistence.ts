import type {
  Extension,
  onLoadDocumentPayload,
  onStoreDocumentPayload,
} from '@hocuspocus/server';
import * as Y from 'yjs';
import type { NoteRepository, YjsRepository } from '../repositories/index.js';
import { logger } from '../utils/logger.js';

const COMPACTION_THRESHOLD = 500;

function collectText(node: Y.XmlFragment | Y.XmlElement): string {
  const parts: string[] = [];
  for (const child of node.toArray()) {
    if (child instanceof Y.XmlText) {
      parts.push(child.toJSON());
    } else if (child instanceof Y.XmlElement) {
      parts.push(collectText(child));
    }
  }
  return parts.join('\n');
}

function extractPlainText(ydoc: Y.Doc): string {
  return collectText(ydoc.getXmlFragment('default'));
}

export class CollaborationPersistence implements Extension {
  constructor(
    private readonly yjsRepo: YjsRepository,
    private readonly noteRepo: NoteRepository,
  ) {}

  async onLoadDocument({
    documentName,
    document,
  }: onLoadDocumentPayload): Promise<void> {
    const yjsDoc = await this.yjsRepo.findDocumentWithUpdates(documentName);

    if (!yjsDoc) {
      logger.debug(
        { documentName },
        'No YjsDocument found, starting with empty doc',
      );
      return;
    }

    if (yjsDoc.snapshot) {
      Y.applyUpdate(document, yjsDoc.snapshot);
    }

    for (const row of yjsDoc.updates) {
      Y.applyUpdate(document, row.update);
    }

    logger.debug(
      { documentName, updatesApplied: yjsDoc.updates.length },
      'Document loaded from DB',
    );
  }

  async onStoreDocument({
    documentName,
    document,
  }: onStoreDocumentPayload): Promise<void> {
    try {
      const yjsDoc = await this.yjsRepo.findDocumentMeta(documentName);

      if (!yjsDoc) {
        logger.warn(
          { documentName },
          'YjsDocument not found on store, skipping',
        );
        return;
      }

      const newStateVector = Y.encodeStateVector(document);

      let diff: Uint8Array;
      if (yjsDoc.stateVector) {
        diff = Y.encodeStateAsUpdate(document, yjsDoc.stateVector);
      } else {
        diff = Y.encodeStateAsUpdate(document);
      }

      if (diff.byteLength <= 2) {
        return;
      }

      await this.yjsRepo.createUpdate(yjsDoc.id, diff, newStateVector);

      const plainText = extractPlainText(document);
      await this.noteRepo.updateContentPlain(documentName, plainText);

      const updateCount = await this.yjsRepo.countUpdates(yjsDoc.id);

      if (updateCount > COMPACTION_THRESHOLD) {
        await this.compact(yjsDoc.id, document);
      }
    } catch (err) {
      logger.error(
        { err, documentName },
        'Failed to store document — will retry on next debounce cycle',
      );
    }
  }

  private async compact(yjsDocId: string, document: Y.Doc): Promise<void> {
    logger.info({ yjsDocId }, 'Compacting Yjs document');

    const snapshot = Y.encodeStateAsUpdate(document);
    const stateVector = Y.encodeStateVector(document);

    await this.yjsRepo.compact(yjsDocId, snapshot, stateVector);

    logger.info({ yjsDocId }, 'Compaction complete');
  }
}
