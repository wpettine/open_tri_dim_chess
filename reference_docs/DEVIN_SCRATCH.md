# Devin Scratchpad – Phase I Execution Notes

Scope: Implement Phase I from NEW_WORLD_STRUCTURE.md (data structures + world instances + visibility), keep notes actionable for me.

Checklist (live):
- [ ] Add/confirm types: TrackState, PinAdjacencyGraph, BoardInstance (track, pin, rotation), Piece.movedByAB
- [ ] World builder: PIN_RANK_OFFSETS, PIN_ADJACENCY, create 24 attack instances, instance IDs {Track}{Pin}:{Rotation}
- [ ] Game state: trackStates/attackBoardStates, initialize defaults, updateInstanceVisibility()
- [ ] Tests: world counts, naming, initial visibility, state init

Repo scan summary:
- Will scan for existing src/engine/world/* and store files before edits.
- If code not present yet (doc-first repo), I will stage type stubs and world builder scaffolding to align with Phase I.

Decisions:
- Use instance naming “QLn:0/180”, “KLn:0/180” consistently across world and state.
- Keep mutations isolated: visibility toggling only; no physical transforms.

Open Questions (to self):
- Confirm whether existing GameState exists; if not, create minimal state scaffolding local to world module for tests.

Work log:
- [T0] Initialized Phase I plan and checklist here.
- [T1] Added Phase I scaffolding: extended types, attached adjacencyGraph in worldBuilder, optional trackStates in GameState, helper tests created.

Decision on legacy tests (Phase I):
- Per Warren: Ignore failing legacy attack-board tests for now; they will be reworked for the new visibility-based system.
- Main board-related tests remain relevant.
- New tests added in this phase (instanceHelpers) must pass; they do.
# Phase II Execution Notes (Ownership/Adjacency + Game State Integration)

Scope: Implement Phase II from NEW_WORLD_STRUCTURE.md:
- Track 1: Ownership & Adjacency Logic
- Track 2: Game State Integration

What shipped:
- Ownership & Adjacency Logic
  - New helpers in src/engine/world/ownership.ts
    - getAdjacentPins, isAdjacent
    - isPinOccupied, getVacantPins
    - getPinOwner, getBoardController
    - getForwardDirection, isForwardMove, isSidewaysMove
    - deriveInstanceIdForBoard, updateInstanceRotation
  - Tests: src/engine/world/__tests__/ownership.test.ts
- Game State Integration
  - GameState extended with attackBoardStates: Record<string, { activeInstanceId: string }>
  - Initialization aligns with initial pins and rotation
  - Store helpers: getActiveInstance(boardId), setActiveInstance(boardId, instanceId)
  - moveAttackBoard/rotateAttackBoard update activeInstanceId
  - Persistence: buildPersistablePayload includes attackBoardStates and boardRotations
  - Hydration: backward-compatible with legacy saves (derives states when missing)
- Movement/validation alignment to REVISED_MEDER_COORDINATE_SYSTEM
  - Half-rank mapping for passenger movement between pins
  - Occupancy rules: block backward moves; block sideways moves that increase distance from away-side
  - Vertical shadow: block any non-knight on W/N/B at any destination square regardless of Z; block attack-board pieces at matching zHeight; checks all four destination squares
- Removed runtime Markdown dependencies in tests
  - attackBoardAdjacencyFromDocs.test.ts now uses engine constants (ATTACK_BOARD_ADJACENCY, classifyDirection), no MD parsing

Key files changed:
- src/engine/world/ownership.ts
- src/store/gameStore.ts
- src/engine/world/worldMutation.ts
- src/engine/world/attackBoardAdjacency.ts (consumed; no format change)
- Tests updated/added under src/engine/world/__tests__/

Reference docs touched:
- reference_docs/ATTACK_BOARD_RULES.md added as static reference but not used at runtime.

PR status:
- Phase II PR merged: https://github.com/wpettine/open_tri_dim_chess/pull/35
- Link to Devin run: https://app.devin.ai/sessions/e9f4be62eb0641d59476d217e5f582c9

Notes/decisions:
- Direction classification uses board controller (board owner when unoccupied; passenger color when occupied).
- Half-rank offsets implemented from REVISED_MEDER_COORDINATE_SYSTEM; future movement logic should assume cell-based rank.
- attackBoardPositions retained for backward compatibility; attackBoardStates introduced for instance addressing.

Follow-ups for next session:
- Add store-level tests around attackBoardStates init/hydration (optional).
- Extend king safety validation once finalized.
- Remove any residual doc-based test scaffolding if reintroduced elsewhere.
