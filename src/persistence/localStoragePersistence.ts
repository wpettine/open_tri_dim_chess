import type { GamePersistence, PersistedGameState, SaveListEntry } from './GamePersistence';
import { PersistedGameStateSchema, SCHEMA_VERSION } from './schema';
import { generateId, nowIso } from './utils';

const INDEX_KEY = 'otdc:saves:index';
const SAVE_KEY = (id: string) => `otdc:saves:${id}`;

function readIndex(): SaveListEntry[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as SaveListEntry[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: SaveListEntry[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
}

function upsertIndex(entry: SaveListEntry) {
  const index = readIndex();
  const idx = index.findIndex((e) => e.id === entry.id);
  if (idx >= 0) index[idx] = entry;
  else index.push(entry);
  writeIndex(index);
}

export class LocalStoragePersistence implements GamePersistence {
  async listSaves(): Promise<SaveListEntry[]> {
    const index = readIndex();
    const hasKingsOnly = index.some((e) => e.name === 'Kings Only');
    if (!hasKingsOnly) {
      const kingsOnlyPieces = [
        {
          id: 'white-king-0',
          type: 'king',
          color: 'white',
          file: 4,
          rank: 0,
          level: 'WKL',
          hasMoved: false,
        },
        {
          id: 'black-king-0',
          type: 'king',
          color: 'black',
          file: 4,
          rank: 9,
          level: 'BKL',
          hasMoved: false,
        },
      ];
      const now = nowIso();
      const id = generateId();
      const doc: PersistedGameState = {
        version: SCHEMA_VERSION,
        createdAt: now,
        updatedAt: now,
        id,
        name: 'Kings Only',
        payload: {
          pieces: kingsOnlyPieces,
          currentTurn: 'white',
          isCheck: false,
          isCheckmate: false,
          isStalemate: false,
          winner: null,
          gameOver: false,
          attackBoardPositions: {
            WQL: 'QL1',
            WKL: 'KL1',
            BQL: 'QL6',
            BKL: 'KL6',
          },
          attackBoardStates: {
            WQL: { activeInstanceId: 'QL1:0' },
            WKL: { activeInstanceId: 'KL1:0' },
            BQL: { activeInstanceId: 'QL6:0' },
            BKL: { activeInstanceId: 'KL6:0' },
          },
          trackStates: {
            QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
            KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
          },
          moveHistory: [],
        },
        integrity: { schemaVersion: SCHEMA_VERSION },
        meta: { source: 'local' },
      } as PersistedGameState;
      const parsed = PersistedGameStateSchema.safeParse(doc);
      if (parsed.success) {
        localStorage.setItem(SAVE_KEY(id), JSON.stringify(doc));
        upsertIndex({ id, name: doc.name, updatedAt: doc.updatedAt, source: 'local' });
        index.push({ id, name: doc.name, updatedAt: doc.updatedAt, source: 'local' });
      }
    }

    const hasKingAndPawn = index.some((e) => e.name === 'King and Pawn');
    if (!hasKingAndPawn) {
      const kingAndPawnPieces = [
        {
          id: 'white-king-0',
          type: 'king',
          color: 'white',
          file: 4,
          rank: 0,
          level: 'WKL',
          hasMoved: false,
        },
        {
          id: 'black-king-0',
          type: 'king',
          color: 'black',
          file: 4,
          rank: 9,
          level: 'BKL',
          hasMoved: false,
        },
        {
          id: 'white-pawn-0',
          type: 'pawn',
          color: 'white',
          file: 0,
          rank: 1,
          level: 'WQL',
          hasMoved: false,
        },
        {
          id: 'black-pawn-0',
          type: 'pawn',
          color: 'black',
          file: 0,
          rank: 8,
          level: 'BQL',
          hasMoved: false,
        },
      ];
      const now = nowIso();
      const id = generateId();
      const doc: PersistedGameState = {
        version: SCHEMA_VERSION,
        createdAt: now,
        updatedAt: now,
        id,
        name: 'King and Pawn',
        payload: {
          pieces: kingAndPawnPieces,
          currentTurn: 'white',
          isCheck: false,
          isCheckmate: false,
          isStalemate: false,
          winner: null,
          gameOver: false,
          attackBoardPositions: {
            WQL: 'QL1',
            WKL: 'KL1',
            BQL: 'QL6',
            BKL: 'KL6',
          },
          attackBoardStates: {
            WQL: { activeInstanceId: 'QL1:0' },
            WKL: { activeInstanceId: 'KL1:0' },
            BQL: { activeInstanceId: 'QL6:0' },
            BKL: { activeInstanceId: 'KL6:0' },
          },
          trackStates: {
            QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
            KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
          },
          moveHistory: [],
        },
        integrity: { schemaVersion: SCHEMA_VERSION },
        meta: { source: 'local' },
      } as PersistedGameState;
      const parsed = PersistedGameStateSchema.safeParse(doc);
      if (parsed.success) {
        localStorage.setItem(SAVE_KEY(id), JSON.stringify(doc));
        upsertIndex({ id, name: doc.name, updatedAt: doc.updatedAt, source: 'local' });
        index.push({ id, name: doc.name, updatedAt: doc.updatedAt, source: 'local' });
      }
    }

    const hasKingsAndQueens = index.some((e) => e.name === 'Kings and Queens');
    if (!hasKingsAndQueens) {
      const kingsAndQueensPieces = [
        {
          id: 'white-king-0',
          type: 'king',
          color: 'white',
          file: 4,
          rank: 0,
          level: 'WKL',
          hasMoved: false,
        },
        {
          id: 'white-queen-0',
          type: 'queen',
          color: 'white',
          file: 1,
          rank: 0,
          level: 'WQL',
          hasMoved: false,
        },
        {
          id: 'black-king-0',
          type: 'king',
          color: 'black',
          file: 4,
          rank: 9,
          level: 'BKL',
          hasMoved: false,
        },
        {
          id: 'black-queen-0',
          type: 'queen',
          color: 'black',
          file: 1,
          rank: 9,
          level: 'BQL',
          hasMoved: false,
        },
      ];
      const now = nowIso();
      const id = generateId();
      const doc: PersistedGameState = {
        version: SCHEMA_VERSION,
        createdAt: now,
        updatedAt: now,
        id,
        name: 'Kings and Queens',
        payload: {
          pieces: kingsAndQueensPieces,
          currentTurn: 'white',
          isCheck: false,
          isCheckmate: false,
          isStalemate: false,
          winner: null,
          gameOver: false,
          attackBoardPositions: {
            WQL: 'QL1',
            WKL: 'KL1',
            BQL: 'QL6',
            BKL: 'KL6',
          },
          attackBoardStates: {
            WQL: { activeInstanceId: 'QL1:0' },
            WKL: { activeInstanceId: 'KL1:0' },
            BQL: { activeInstanceId: 'QL6:0' },
            BKL: { activeInstanceId: 'KL6:0' },
          },
          trackStates: {
            QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
            KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
          },
          moveHistory: [],
        },
        integrity: { schemaVersion: SCHEMA_VERSION },
        meta: { source: 'local' },
      } as PersistedGameState;
      const parsed = PersistedGameStateSchema.safeParse(doc);
      if (parsed.success) {
        localStorage.setItem(SAVE_KEY(id), JSON.stringify(doc));
        upsertIndex({ id, name: doc.name, updatedAt: doc.updatedAt, source: 'local' });
        index.push({ id, name: doc.name, updatedAt: doc.updatedAt, source: 'local' });
      }
    }

    const hasKingsAndRooks = index.some((e) => e.name === 'Kings and Rooks');
    if (!hasKingsAndRooks) {
      const kingsAndRooksPieces = [
        {
          id: 'white-king-0',
          type: 'king',
          color: 'white',
          file: 4,
          rank: 0,
          level: 'WKL',
          hasMoved: false,
        },
        {
          id: 'white-rook-0',
          type: 'rook',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'WQL',
          hasMoved: false,
        },
        {
          id: 'white-rook-1',
          type: 'rook',
          color: 'white',
          file: 5,
          rank: 0,
          level: 'WKL',
          hasMoved: false,
        },
        {
          id: 'black-king-0',
          type: 'king',
          color: 'black',
          file: 4,
          rank: 9,
          level: 'BKL',
          hasMoved: false,
        },
        {
          id: 'black-rook-0',
          type: 'rook',
          color: 'black',
          file: 0,
          rank: 9,
          level: 'BQL',
          hasMoved: false,
        },
        {
          id: 'black-rook-1',
          type: 'rook',
          color: 'black',
          file: 5,
          rank: 9,
          level: 'BKL',
          hasMoved: false,
        },
      ];
      const now = nowIso();
      const id = generateId();
      const doc: PersistedGameState = {
        version: SCHEMA_VERSION,
        createdAt: now,
        updatedAt: now,
        id,
        name: 'Kings and Rooks',
        payload: {
          pieces: kingsAndRooksPieces,
          currentTurn: 'white',
          isCheck: false,
          isCheckmate: false,
          isStalemate: false,
          winner: null,
          gameOver: false,
          attackBoardPositions: {
            WQL: 'QL1',
            WKL: 'KL1',
            BQL: 'QL6',
            BKL: 'KL6',
          },
          attackBoardStates: {
            WQL: { activeInstanceId: 'QL1:0' },
            WKL: { activeInstanceId: 'KL1:0' },
            BQL: { activeInstanceId: 'QL6:0' },
            BKL: { activeInstanceId: 'KL6:0' },
          },
          trackStates: {
            QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
            KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
          },
          moveHistory: [],
        },
        integrity: { schemaVersion: SCHEMA_VERSION },
        meta: { source: 'local' },
      } as PersistedGameState;
      const parsed = PersistedGameStateSchema.safeParse(doc);
      if (parsed.success) {
        localStorage.setItem(SAVE_KEY(id), JSON.stringify(doc));
        upsertIndex({ id, name: doc.name, updatedAt: doc.updatedAt, source: 'local' });
        index.push({ id, name: doc.name, updatedAt: doc.updatedAt, source: 'local' });
      }
    }

    const hasKingsPawnsRooks = index.some((e) => e.name === 'Kings, pawns and rooks');
    if (!hasKingsPawnsRooks) {
      const kingsPawnsRooksPieces = [
        {
          id: 'white-king-0',
          type: 'king',
          color: 'white',
          file: 4,
          rank: 0,
          level: 'WKL',
          hasMoved: false,
        },
        {
          id: 'white-rook-0',
          type: 'rook',
          color: 'white',
          file: 0,
          rank: 0,
          level: 'WQL',
          hasMoved: false,
        },
        {
          id: 'white-rook-1',
          type: 'rook',
          color: 'white',
          file: 5,
          rank: 0,
          level: 'WKL',
          hasMoved: false,
        },
        {
          id: 'white-pawn-0',
          type: 'pawn',
          color: 'white',
          file: 0,
          rank: 1,
          level: 'WQL',
          hasMoved: false,
        },
        {
          id: 'white-pawn-1',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 1,
          level: 'WQL',
          hasMoved: false,
        },
        {
          id: 'white-pawn-2',
          type: 'pawn',
          color: 'white',
          file: 4,
          rank: 1,
          level: 'WKL',
          hasMoved: false,
        },
        {
          id: 'white-pawn-3',
          type: 'pawn',
          color: 'white',
          file: 5,
          rank: 1,
          level: 'WKL',
          hasMoved: false,
        },
        {
          id: 'white-pawn-4',
          type: 'pawn',
          color: 'white',
          file: 1,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'white-pawn-5',
          type: 'pawn',
          color: 'white',
          file: 2,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'white-pawn-6',
          type: 'pawn',
          color: 'white',
          file: 3,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'white-pawn-7',
          type: 'pawn',
          color: 'white',
          file: 4,
          rank: 2,
          level: 'W',
          hasMoved: false,
        },
        {
          id: 'black-king-0',
          type: 'king',
          color: 'black',
          file: 4,
          rank: 9,
          level: 'BKL',
          hasMoved: false,
        },
        {
          id: 'black-rook-0',
          type: 'rook',
          color: 'black',
          file: 0,
          rank: 9,
          level: 'BQL',
          hasMoved: false,
        },
        {
          id: 'black-rook-1',
          type: 'rook',
          color: 'black',
          file: 5,
          rank: 9,
          level: 'BKL',
          hasMoved: false,
        },
        {
          id: 'black-pawn-0',
          type: 'pawn',
          color: 'black',
          file: 0,
          rank: 8,
          level: 'BQL',
          hasMoved: false,
        },
        {
          id: 'black-pawn-1',
          type: 'pawn',
          color: 'black',
          file: 1,
          rank: 8,
          level: 'BQL',
          hasMoved: false,
        },
        {
          id: 'black-pawn-2',
          type: 'pawn',
          color: 'black',
          file: 4,
          rank: 8,
          level: 'BKL',
          hasMoved: false,
        },
        {
          id: 'black-pawn-3',
          type: 'pawn',
          color: 'black',
          file: 5,
          rank: 8,
          level: 'BKL',
          hasMoved: false,
        },
        {
          id: 'black-pawn-4',
          type: 'pawn',
          color: 'black',
          file: 1,
          rank: 7,
          level: 'B',
          hasMoved: false,
        },
        {
          id: 'black-pawn-5',
          type: 'pawn',
          color: 'black',
          file: 2,
          rank: 7,
          level: 'B',
          hasMoved: false,
        },
        {
          id: 'black-pawn-6',
          type: 'pawn',
          color: 'black',
          file: 3,
          rank: 7,
          level: 'B',
          hasMoved: false,
        },
        {
          id: 'black-pawn-7',
          type: 'pawn',
          color: 'black',
          file: 4,
          rank: 7,
          level: 'B',
          hasMoved: false,
        },
      ];
      const now = nowIso();
      const id = generateId();
      const doc: PersistedGameState = {
        version: SCHEMA_VERSION,
        createdAt: now,
        updatedAt: now,
        id,
        name: 'Kings, pawns and rooks',
        payload: {
          pieces: kingsPawnsRooksPieces,
          currentTurn: 'white',
          isCheck: false,
          isCheckmate: false,
          isStalemate: false,
          winner: null,
          gameOver: false,
          attackBoardPositions: {
            WQL: 'QL1',
            WKL: 'KL1',
            BQL: 'QL6',
            BKL: 'KL6',
          },
          attackBoardStates: {
            WQL: { activeInstanceId: 'QL1:0' },
            WKL: { activeInstanceId: 'KL1:0' },
            BQL: { activeInstanceId: 'QL6:0' },
            BKL: { activeInstanceId: 'KL6:0' },
          },
          trackStates: {
            QL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
            KL: { whiteBoardPin: 1, blackBoardPin: 6, whiteRotation: 0, blackRotation: 0 },
          },
          moveHistory: [],
        },
        integrity: { schemaVersion: SCHEMA_VERSION },
        meta: { source: 'local' },
      } as PersistedGameState;
      const parsed = PersistedGameStateSchema.safeParse(doc);
      if (parsed.success) {
        localStorage.setItem(SAVE_KEY(id), JSON.stringify(doc));
        upsertIndex({ id, name: doc.name, updatedAt: doc.updatedAt, source: 'local' });
        index.push({ id, name: doc.name, updatedAt: doc.updatedAt, source: 'local' });
      }
    }

    return index;
  }

  async saveGame(entry: Omit<PersistedGameState, 'createdAt' | 'updatedAt' | 'id'> & Partial<Pick<PersistedGameState, 'id'>>): Promise<PersistedGameState> {
    const id = entry.id ?? generateId();
    const now = nowIso();
    const doc: PersistedGameState = {
      ...entry,
      id,
      createdAt: entry.id ? entry['createdAt' as keyof typeof entry] as string ?? now : now,
      updatedAt: now,
      version: entry.version ?? SCHEMA_VERSION,
      integrity: {
        schemaVersion: SCHEMA_VERSION,
        ...(entry.integrity ?? {}),
      },
      meta: {
        source: 'local',
        ...(entry.meta ?? {}),
      },
    } as PersistedGameState;

    const parsed = PersistedGameStateSchema.safeParse(doc);
    if (!parsed.success) {
      throw new Error('Invalid game state: ' + parsed.error.message);
    }

    localStorage.setItem(SAVE_KEY(id), JSON.stringify(doc));
    upsertIndex({ id, name: doc.name, updatedAt: doc.updatedAt, source: 'local' });
    return doc;
  }

  async loadGame(id: string): Promise<PersistedGameState | null> {
    const raw = localStorage.getItem(SAVE_KEY(id));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    const parsed = PersistedGameStateSchema.safeParse(obj);
    if (!parsed.success) {
      throw new Error('Saved game schema mismatch: ' + parsed.error.message);
    }
    if (parsed.data.version !== SCHEMA_VERSION) {
      throw new Error(`Unsupported save version ${parsed.data.version}, expected ${SCHEMA_VERSION}`);
    }
    return parsed.data;
  }

  async deleteGame(id: string): Promise<void> {
    localStorage.removeItem(SAVE_KEY(id));
    const index = readIndex().filter((e) => e.id !== id);
    writeIndex(index);
  }

  async exportGame(id: string): Promise<string> {
    const raw = localStorage.getItem(SAVE_KEY(id));
    if (!raw) throw new Error('Save not found');
    return raw;
  }

  async importGame(json: string): Promise<PersistedGameState> {
    const obj = JSON.parse(json);
    const parsed = PersistedGameStateSchema.safeParse(obj);
    if (!parsed.success) {
      throw new Error('Invalid import: ' + parsed.error.message);
    }
    const incoming = parsed.data;
    const exists = localStorage.getItem(SAVE_KEY(incoming.id));
    const id = exists ? generateId() : incoming.id;
    const now = nowIso();
    const doc: PersistedGameState = {
      ...incoming,
      id,
      updatedAt: now,
      integrity: { schemaVersion: SCHEMA_VERSION, ...(incoming.integrity ?? {}) },
      meta: { source: 'local', ...(incoming.meta ?? {}) },
    };
    localStorage.setItem(SAVE_KEY(id), JSON.stringify(doc));
    upsertIndex({ id, name: doc.name, updatedAt: doc.updatedAt, source: 'local' });
    return doc;
  }
}
