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
    return readIndex();
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
