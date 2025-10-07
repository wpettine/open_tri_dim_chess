# Save/Load Design Plan (Local-first, Firebase-extensible)

Goal
- Implement robust local save/load for single-player sessions.
- Keep the domain model and API extensible so we can swap or add Firebase persistence without refactoring UI or game logic.

Scope (Phase A: Local)
- Add save, load, delete, auto-save, and list-saves using localStorage.
- Provide JSON export/import for portability and debugging.
- Validate schema and version to prevent loading incompatible saves.

Extensibility (Phase B: Firebase)
- Abstract a persistence interface so implementations can be swapped (localStorage vs. Firebase).
- Add metadata for userId, timestamps, and hash to support multi-device and cloud sync later.

Domain Model

1) PersistedGameState (versioned)
- version: number
- createdAt: ISO string
- updatedAt: ISO string
- id: string (uuid)
- name: string (user-friendly title)
- payload:
  - world: ChessWorld (serializable form)
  - pieces: Piece[]
  - currentTurn: 'white' | 'black'
  - isCheck: boolean
  - isCheckmate: boolean
  - isStalemate: boolean
  - winner: 'white' | 'black' | null
  - gameOver: boolean
  - attackBoardPositions: Record<string, string>
  - moveHistory: Move[]
  - camera?: {
      currentView: 'default' | 'top' | 'side' | 'front'
    }
- integrity:
  - schemaVersion: number (duplicate of version for clarity)
  - checksum?: string (sha256 over payload for future use)
- meta:
  - source: 'local' | 'firebase'
  - userId?: string

Notes:
- world needs a plain-JSON form. If ChessWorld contains Maps/Sets, persist as arrays/objects with explicit keys. Existing world.squares: Map<string, WorldSquare> will be serialized as array of [id, WorldSquare] or as plain object keyed by id.
- On load, reconstruct into runtime types (rebuild Map).

2) SaveListEntry
- id: string
- name: string
- updatedAt: ISO string
- source: 'local' | 'firebase'

Persistence Interface

export interface GamePersistence {
  listSaves(): Promise<SaveListEntry[]>
  saveGame(entry: Omit<PersistedGameState, 'createdAt' | 'updatedAt' | 'id'> & Partial<Pick<PersistedGameState, 'id'>>): Promise<PersistedGameState>
  loadGame(id: string): Promise<PersistedGameState | null>
  deleteGame(id: string): Promise<void>
  exportGame(id: string): Promise<string> // JSON string
  importGame(json: string): Promise<PersistedGameState> // validates schema & version
}

Local Implementation (Phase A)

Storage keys
- 'otdc:saves:index' -> SaveListEntry[] (local-only)
- 'otdc:saves:{id}' -> PersistedGameState JSON

Operations
- listSaves: read index; fallback to [].
- saveGame:
  - if no id, generate uuid v4
  - set timestamps; increment version if needed
  - validate payload schema
  - compute checksum (optional now)
  - write otdc:saves:{id}
  - upsert index
- loadGame:
  - read otdc:saves:{id}
  - validate version/schema
  - return parsed PersistedGameState
- deleteGame:
  - remove otdc:saves:{id}
  - update index
- exportGame:
  - return stringified PersistedGameState
- importGame:
  - parse, validate schema and version
  - if id conflicts, generate new id unless user chooses overwrite (future)
  - write and index

Schema and Validation

- Define a zod schema in src/persistence/schema.ts
  - Piece: fields id, type, color, file, rank, level, hasMoved
  - Move: union of 'piece-move' and 'board-move'
  - WorldSquare: serializable fields only
  - World: store as:
    - squares: Array<{ id: string; file: number; rank: number; boardId: string; ... }>
    - anything derived can be recomputed on load
- Versioning:
  - SCHEMA_VERSION = 1
  - On load, if version !== SCHEMA_VERSION, attempt migration if available; otherwise reject with friendly error.

Reconstruction on Load

- world: rebuild ChessWorld by using createChessWorld() and then updating mutable portions to match persisted payload (preferred), or directly rehydrate from persisted squares via a helper if createChessWorld is deterministic and payload only needs to set dynamic parts.
- pieces: assign array directly after validation.
- attackBoardPositions: assign after validation.
- turn & flags: assign and then call updateGameState() to confirm consistency.
- camera: set via cameraStore if present.

Auto-save Strategy

- Trigger on:
  - After every successful movePiece()
  - After resetGame() creates new session (optional)
  - Debounce 300-500ms if moves can be batched
- Save with a default name like "Autosave" tied to a fixed id 'autosave' so only one entry updates. Expose a setting to disable autosave.

UI Integration

- Add Save/Load controls in MoveHistory panel (already planned):
  - Buttons: New Game, Save, Load, Delete, Export, Import
  - Save modal: name input, Overwrite if id exists
  - Load modal: list from listSaves(), preview metadata, Confirm load
  - Delete confirmation
  - Export downloads JSON file
  - Import selects file and reads JSON with validation errors shown
- Non-blocking toasts for success/failure.

State Store Integration

- gameStore:
  - add actions:
    - saveCurrentGame(name?: string): Promise<void>
    - loadGameById(id: string): Promise<void>
    - deleteGameById(id: string): Promise<void>
    - exportGameById(id: string): Promise<void>
    - importGameFromJson(json: string): Promise<void>
  - expose a selector for moveHistory/world/pieces, etc., to construct payload
  - add hydrateFromPersisted(state: PersistedGameState['payload']): void
- cameraStore:
  - accessor to get/set currentView for inclusion in payload

Error Handling

- Graceful handling for:
  - localStorage quota exceeded
  - corrupt JSON (parse failure)
  - schema mismatch
  - missing id
- User feedback: toast with retry instructions.
- Logging: console.warn in dev.

Testing

- Unit tests for:
  - schema validation and round-trip (save → load equals)
  - map rehydration correctness
  - auto-save debounced behavior
  - import/export with invalid JSON
- Integration test:
  - execute moves, auto-save, load autosave, verify board/pieces/turn flags.

Security & Privacy

- Local storage only for Phase A; no PII.
- Avoid huge binary assets in payload; keep to JSON.

Future: Firebase Extension (Phase B)

- Implement GamePersistenceFirebase:
  - listSaves: query user collection
  - saveGame: set doc with server timestamp
  - loadGame/deleteGame: by doc id
  - export/import: same JSON schema
- Auth: integrate Firebase Auth to get userId
- Conflict resolution:
  - last-write-wins initially
  - later: add ETag/updatedAt compare with prompts
- Sync policy:
  - opt-in toggle to auto-sync locals to cloud.

Migration Strategy

- Introduce a migration registry:
  - const migrations: Record<number, (old) => new>
  - On load, while (state.version < SCHEMA_VERSION) apply migrations sequentially
- Start at v1 with no migrations; prepare skeleton.

Implementation Placement

- src/persistence/
  - GamePersistence.ts (interface)
  - localStoragePersistence.ts (implementation)
  - schema.ts (zod schemas, SCHEMA_VERSION)
  - types.ts (PersistedGameState, SaveListEntry)
  - utils.ts (uuid, checksum, debounce)
- src/store/
  - gameStore.ts: add actions and hydrateFromPersisted
  - cameraStore.ts: expose getter/setter for view
- src/components/UI/
  - SaveLoadControls.tsx (or integrate into MoveHistory panel)
  - Modals for save/load/import
- reference_docs/
  - SAVE_LOAD_DESIGN_PLAN.md (this file)

Rollout Plan

1) Infra:
  - Add persistence/ types, schema, local impl, unit tests
2) Store:
  - Add selectors/actions; implement hydrate and auto-save
3) UI:
  - Add basic Save/Load buttons and simple dialogs
4) Export/Import:
  - File-based handlers with schema validation
5) Polish:
  - Debounce, toasts, error flows
6) Future:
  - Firebase implementation and switch via app config

Notes from SAVE_LOAD_DESIGN_IDEAS alignment

- Ensure JSON is human-readable and minimal to support sharing
- Keep camera and UI state optional
- Validate and refuse to load if world configuration differs (e.g., board definitions); fallback to recreate world and only apply movable state (pieces, turn) if needed
- Maintain a single 'autosave' slot to avoid clutter while allowing named manual saves

Acceptance Criteria (Phase A)

- User can: New, Save (named), Load (from list), Delete, Export, Import
- Auto-save updates 'autosave' after each move
- Loading a save correctly restores pieces, turn, flags, attack board positions, and move history
- All tests pass and schema validated
