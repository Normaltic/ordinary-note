import type { Extension, onLoadDocumentPayload, onStoreDocumentPayload } from '@hocuspocus/server';
import * as Y from 'yjs';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

const COMPACTION_THRESHOLD = 500;

function extractPlainText(ydoc: Y.Doc): string {
  const xmlFragment = ydoc.getXmlFragment('default');
  return xmlFragment.toJSON();
}

export class PrismaPeristence implements Extension {
  async onLoadDocument({ documentName, document }: onLoadDocumentPayload): Promise<void> {
    const yjsDoc = await prisma.yjsDocument.findUnique({
      where: { noteId: documentName },
      include: {
        updates: { orderBy: { id: 'asc' }, select: { update: true } },
      },
    });

    if (!yjsDoc) {
      logger.debug({ documentName }, 'No YjsDocument found, starting with empty doc');
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

  async onStoreDocument({ documentName, document }: onStoreDocumentPayload): Promise<void> {
    try {
      const yjsDoc = await prisma.yjsDocument.findUnique({
        where: { noteId: documentName },
        select: { id: true, stateVector: true },
      });

      if (!yjsDoc) {
        logger.warn({ documentName }, 'YjsDocument not found on store, skipping');
        return;
      }

      const newStateVector = Y.encodeStateVector(document);

      let diff: Uint8Array;
      if (yjsDoc.stateVector) {
        diff = Y.encodeStateAsUpdate(document, yjsDoc.stateVector);
      } else {
        diff = Y.encodeStateAsUpdate(document);
      }

      // Skip empty updates
      if (diff.byteLength <= 2) {
        return;
      }

      await prisma.yjsUpdate.create({
        data: {
          yjsDocumentId: yjsDoc.id,
          update: Buffer.from(diff),
        },
      });

      await prisma.yjsDocument.update({
        where: { id: yjsDoc.id },
        data: { stateVector: Buffer.from(newStateVector) },
      });

      // Extract plain text and update note
      const plainText = extractPlainText(document);
      await prisma.note.update({
        where: { id: documentName },
        data: {
          contentPlain: plainText,
          updatedAt: new Date(),
        },
      });

      // Check compaction
      const updateCount = await prisma.yjsUpdate.count({
        where: { yjsDocumentId: yjsDoc.id },
      });

      if (updateCount > COMPACTION_THRESHOLD) {
        await this.compact(yjsDoc.id, document);
      }
    } catch (err) {
      logger.error({ err, documentName }, 'Failed to store document — will retry on next debounce cycle');
    }
  }

  private async compact(yjsDocId: string, document: Y.Doc): Promise<void> {
    logger.info({ yjsDocId }, 'Compacting Yjs document');

    const snapshot = Y.encodeStateAsUpdate(document);
    const stateVector = Y.encodeStateVector(document);

    await prisma.$transaction([
      prisma.yjsDocument.update({
        where: { id: yjsDocId },
        data: {
          snapshot: Buffer.from(snapshot),
          stateVector: Buffer.from(stateVector),
        },
      }),
      prisma.yjsUpdate.deleteMany({
        where: { yjsDocumentId: yjsDocId },
      }),
    ]);

    logger.info({ yjsDocId }, 'Compaction complete');
  }
}
