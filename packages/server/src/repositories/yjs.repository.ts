import { prisma } from '../utils/prisma.js';

export type YjsDocumentWithUpdates = {
  id: string;
  noteId: string;
  snapshot: Uint8Array | null;
  stateVector: Uint8Array | null;
  updates: { update: Uint8Array }[];
};

export type YjsDocumentMeta = {
  id: string;
  stateVector: Uint8Array | null;
};

export class YjsRepository {
  async findDocumentWithUpdates(
    noteId: string,
  ): Promise<YjsDocumentWithUpdates | null> {
    return prisma.yjsDocument.findUnique({
      where: { noteId },
      include: {
        updates: { orderBy: { id: 'asc' }, select: { update: true } },
      },
    });
  }

  async findDocumentMeta(noteId: string): Promise<YjsDocumentMeta | null> {
    return prisma.yjsDocument.findUnique({
      where: { noteId },
      select: { id: true, stateVector: true },
    });
  }

  async createUpdate(
    yjsDocumentId: string,
    update: Uint8Array,
    stateVector: Uint8Array,
  ): Promise<void> {
    await prisma.$transaction([
      prisma.yjsUpdate.create({
        data: { yjsDocumentId, update: Buffer.from(update) },
      }),
      prisma.yjsDocument.update({
        where: { id: yjsDocumentId },
        data: { stateVector: Buffer.from(stateVector) },
      }),
    ]);
  }

  async countUpdates(yjsDocumentId: string): Promise<number> {
    return prisma.yjsUpdate.count({
      where: { yjsDocumentId },
    });
  }

  async compact(
    yjsDocumentId: string,
    snapshot: Uint8Array,
    stateVector: Uint8Array,
  ): Promise<void> {
    await prisma.$transaction([
      prisma.yjsDocument.update({
        where: { id: yjsDocumentId },
        data: {
          snapshot: Buffer.from(snapshot),
          stateVector: Buffer.from(stateVector),
        },
      }),
      prisma.yjsUpdate.deleteMany({
        where: { yjsDocumentId },
      }),
    ]);
  }
}
