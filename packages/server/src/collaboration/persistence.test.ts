import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { onLoadDocumentPayload, onStoreDocumentPayload } from '@hocuspocus/server';
import * as Y from 'yjs';
import { CollaborationPersistence } from './persistence.js';
import { createMockYjsRepo, createMockNoteRepo } from '../testing/helpers.js';

vi.mock('../utils/config.js', () => ({
  config: {
    jwt: {
      accessSecret: 'test-access-secret',
      refreshSecret: 'test-refresh-secret',
      accessExpiresIn: '1h',
      refreshExpiresIn: '14d',
      refreshMaxAge: 14 * 24 * 60 * 60 * 1000,
    },
    google: { clientId: 'test-client-id' },
  },
}));

/** Y.Doc에 텍스트를 추가하고 반환 */
function createDocWithText(text: string): Y.Doc {
  const doc = new Y.Doc();
  const fragment = doc.getXmlFragment('default');
  const el = new Y.XmlElement('paragraph');
  el.insert(0, [new Y.XmlText(text)]);
  fragment.insert(0, [el]);
  return doc;
}

describe('CollaborationPersistence', () => {
  let yjsRepo: ReturnType<typeof createMockYjsRepo>;
  let noteRepo: ReturnType<typeof createMockNoteRepo>;
  let persistence: CollaborationPersistence;

  beforeEach(() => {
    vi.clearAllMocks();
    yjsRepo = createMockYjsRepo();
    noteRepo = createMockNoteRepo();
    persistence = new CollaborationPersistence(yjsRepo as never, noteRepo as never);
  });

  // ── onLoadDocument ─────────────────────────────────────────────────

  describe('onLoadDocument', () => {
    it('YjsDocument 없음 → document 변경 없음', async () => {
      yjsRepo.findDocumentWithUpdates.mockResolvedValue(null);
      const doc = new Y.Doc();

      await persistence.onLoadDocument({
        documentName: 'note-1',
        document: doc,
      } as onLoadDocumentPayload);

      expect(doc.getXmlFragment('default').length).toBe(0);
    });

    it('스냅샷만 있음 → snapshot 적용', async () => {
      const source = createDocWithText('hello');
      const snapshot = Y.encodeStateAsUpdate(source);

      yjsRepo.findDocumentWithUpdates.mockResolvedValue({
        id: 'yjs-1',
        noteId: 'note-1',
        snapshot,
        stateVector: null,
        updates: [],
      });

      const doc = new Y.Doc();
      await persistence.onLoadDocument({
        documentName: 'note-1',
        document: doc,
      } as onLoadDocumentPayload);

      const text = doc.getXmlFragment('default').toJSON();
      expect(text).toContain('hello');
    });

    it('스냅샷 + 업데이트 → 순차 적용', async () => {
      // 1단계: snapshot 생성
      const base = createDocWithText('hello');
      const snapshot = Y.encodeStateAsUpdate(base);
      const baseStateVector = Y.encodeStateVector(base);

      // 2단계: 추가 수정 → diff 캡처
      const el = new Y.XmlElement('paragraph');
      el.insert(0, [new Y.XmlText(' world')]);
      base.getXmlFragment('default').insert(1, [el]);
      const update = Y.encodeStateAsUpdate(base, baseStateVector);

      yjsRepo.findDocumentWithUpdates.mockResolvedValue({
        id: 'yjs-1',
        noteId: 'note-1',
        snapshot,
        stateVector: null,
        updates: [{ update }],
      });

      const doc = new Y.Doc();
      await persistence.onLoadDocument({
        documentName: 'note-1',
        document: doc,
      } as onLoadDocumentPayload);

      const json = doc.getXmlFragment('default').toJSON();
      expect(json).toContain('hello');
      expect(json).toContain('world');
    });

    it('snapshot null + updates → updates만 적용', async () => {
      const source = createDocWithText('only updates');
      const update = Y.encodeStateAsUpdate(source);

      yjsRepo.findDocumentWithUpdates.mockResolvedValue({
        id: 'yjs-1',
        noteId: 'note-1',
        snapshot: null,
        stateVector: null,
        updates: [{ update }],
      });

      const doc = new Y.Doc();
      await persistence.onLoadDocument({
        documentName: 'note-1',
        document: doc,
      } as onLoadDocumentPayload);

      expect(doc.getXmlFragment('default').toJSON()).toContain('only updates');
    });
  });

  // ── onStoreDocument ────────────────────────────────────────────────

  describe('onStoreDocument', () => {
    it('문서 없음 → 조기 반환, createUpdate 미호출', async () => {
      yjsRepo.findDocumentMeta.mockResolvedValue(null);
      const doc = createDocWithText('test');

      await persistence.onStoreDocument({
        documentName: 'note-1',
        document: doc,
      } as unknown as onStoreDocumentPayload);

      expect(yjsRepo.createUpdate).not.toHaveBeenCalled();
    });

    it('변화 없음 (diff ≤ 2 bytes) → createUpdate 미호출', async () => {
      const doc = createDocWithText('test');
      const stateVector = Y.encodeStateVector(doc);

      yjsRepo.findDocumentMeta.mockResolvedValue({
        id: 'yjs-1',
        stateVector,
      });

      await persistence.onStoreDocument({
        documentName: 'note-1',
        document: doc,
      } as unknown as onStoreDocumentPayload);

      expect(yjsRepo.createUpdate).not.toHaveBeenCalled();
    });

    it('첫 저장 (stateVector null) → 전체 diff 저장', async () => {
      const doc = createDocWithText('first save');
      yjsRepo.findDocumentMeta.mockResolvedValue({
        id: 'yjs-1',
        stateVector: null,
      });
      yjsRepo.countUpdates.mockResolvedValue(1);

      await persistence.onStoreDocument({
        documentName: 'note-1',
        document: doc,
      } as unknown as onStoreDocumentPayload);

      expect(yjsRepo.createUpdate).toHaveBeenCalledWith(
        'yjs-1',
        expect.any(Uint8Array),
        expect.any(Uint8Array),
      );
      expect(noteRepo.updateContentPlain).toHaveBeenCalledWith('note-1', 'first save');
    });

    it('증분 저장 (stateVector 있음) → diff만 저장 + contentPlain 갱신', async () => {
      // 초기 상태
      const base = createDocWithText('base');
      const oldStateVector = Y.encodeStateVector(base);

      // 수정
      const el = new Y.XmlElement('paragraph');
      el.insert(0, [new Y.XmlText(' added')]);
      base.getXmlFragment('default').insert(1, [el]);

      yjsRepo.findDocumentMeta.mockResolvedValue({
        id: 'yjs-1',
        stateVector: oldStateVector,
      });
      yjsRepo.countUpdates.mockResolvedValue(10);

      await persistence.onStoreDocument({
        documentName: 'note-1',
        document: base,
      } as unknown as onStoreDocumentPayload);

      expect(yjsRepo.createUpdate).toHaveBeenCalledOnce();
      expect(noteRepo.updateContentPlain).toHaveBeenCalledWith(
        'note-1',
        expect.stringContaining('base'),
      );
    });

    it('countUpdates > 500 → compact 호출', async () => {
      const doc = createDocWithText('compact me');
      yjsRepo.findDocumentMeta.mockResolvedValue({
        id: 'yjs-1',
        stateVector: null,
      });
      yjsRepo.countUpdates.mockResolvedValue(501);

      await persistence.onStoreDocument({
        documentName: 'note-1',
        document: doc,
      } as unknown as onStoreDocumentPayload);

      expect(yjsRepo.compact).toHaveBeenCalledWith(
        'yjs-1',
        expect.any(Uint8Array),
        expect.any(Uint8Array),
      );
    });

    it('repo 에러 → throw 안 함', async () => {
      yjsRepo.findDocumentMeta.mockRejectedValue(new Error('DB error'));
      const doc = createDocWithText('test');

      await expect(
        persistence.onStoreDocument({
          documentName: 'note-1',
          document: doc,
        } as unknown as onStoreDocumentPayload),
      ).resolves.not.toThrow();
    });
  });

  // ── 통합 시나리오 ──────────────────────────────────────────────────

  describe('load → edit → store', () => {
    it('저장된 문서를 로드 후 수정, 다시 저장 시 diff가 올바름', async () => {
      // 1. 원본 문서 생성 & snapshot
      const original = createDocWithText('original');
      const snapshot = Y.encodeStateAsUpdate(original);
      const stateVector = Y.encodeStateVector(original);

      // 2. load
      yjsRepo.findDocumentWithUpdates.mockResolvedValue({
        id: 'yjs-1',
        noteId: 'note-1',
        snapshot,
        stateVector,
        updates: [],
      });

      const doc = new Y.Doc();
      await persistence.onLoadDocument({
        documentName: 'note-1',
        document: doc,
      } as onLoadDocumentPayload);

      // 3. edit
      const fragment = doc.getXmlFragment('default');
      const el = new Y.XmlElement('paragraph');
      el.insert(0, [new Y.XmlText('appended')]);
      fragment.insert(fragment.length, [el]);

      // 4. store
      yjsRepo.findDocumentMeta.mockResolvedValue({
        id: 'yjs-1',
        stateVector,
      });
      yjsRepo.countUpdates.mockResolvedValue(1);

      await persistence.onStoreDocument({
        documentName: 'note-1',
        document: doc,
      } as unknown as onStoreDocumentPayload);

      // 5. 저장된 diff를 새 문서에 적용하면 edit 내용만 포함
      const savedDiff = yjsRepo.createUpdate.mock.calls[0][1] as Uint8Array;
      const verify = new Y.Doc();
      Y.applyUpdate(verify, snapshot);
      Y.applyUpdate(verify, savedDiff);

      const json = verify.getXmlFragment('default').toJSON();
      expect(json).toContain('original');
      expect(json).toContain('appended');
    });
  });
});
