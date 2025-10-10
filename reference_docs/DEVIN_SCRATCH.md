Phase III Progress and Handoff Notes (Devin)
Updated: 2025-10-10

HMR note (2025-10-10): Addressed dev-time error "RefreshRuntime.getRefreshReg is not a function" observed in BoardRenderer.tsx during Vite hot reload. Root cause was environment mismatch: @vitejs/plugin-react@5 with Vite 7 requires Node >=20.19. On Node <20, Fast Refresh runtime can misbehave. Resolution:
- enforce Node engines ">=20.19.0" in package.json
- update README to require Node 20.19+
- clear caches when switching Node versions: rm -rf node_modules node_modules/.vite && npm install
- retest via npm run dev


Summary of work completed in PR #37
- Implemented initial Phase III scaffolding:
  - Added instance-based activation API in src/engine/world/worldMutation.ts:
    - validateActivation(ctx) wraps existing validateBoardMove
    - executeActivation(ctx) wraps executeBoardMove and computes activeInstanceId via makeInstanceId
  - Migrated gameStore calls to use activation API:
    - moveAttackBoard, canMoveBoard, canRotate, rotateAttackBoard call validateActivation/executeActivation
    - attackBoardStates[boardId].activeInstanceId updated from executeActivation result
  - Fixed type issues for adjacency:
    - ownership.getAdjacentPins uses precise 1..6 numeric keys
    - worldBuilder casts PIN_ADJACENCY to PinAdjacencyGraph
- Lint/tests:
  - All tests pass locally; lint has two unrelated warnings
  - CI: GitGuardian passed

References
- PR: https://github.com/wpettine/open_tri_dim_chess/pull/37
- Devin run: https://app.devin.ai/sessions/1b9a26e0c8364847b377cc8fd5eb3a9c
- Changed files:
  - src/engine/world/worldMutation.ts
  - src/store/gameStore.ts
  - src/engine/world/ownership.ts
  - src/engine/world/worldBuilder.ts

Next Implementation Steps (Phase III per NEW_WORLD_STRUCTURE.md)
1) Instance visibility toggling
- Goal: toggle prebuilt board instances visible/invisible instead of physically translating boards.
- Where:
  - src/engine/world/visibility.ts: Use/update updateInstanceVisibility(world, trackStates)
  - src/store/gameStore.ts:
    - After executeActivation in moveAttackBoard and rotateAttackBoard:
      - Update trackStates per boardId owner and toPin/rotation
      - Call updateInstanceVisibility(state.world, state.trackStates)
- Notes:
  - Maintain backward compatibility: keep attackBoardPositions updated for persistence
  - Do not modify world.square IDs; only toggle isVisible and use activeInstanceId

2) TrackState updates
- Goal: keep authoritative pin/rotation per color and track.
- Where:
  - src/store/gameStore.ts: compute next trackStates values based on boardId and toPinId/rotate
    - White QL/KL vs Black QL/KL update appropriate entries
  - Ensure hydrateFromPersisted wires visibility from persisted trackStates if present later
- Output:
  - state.trackStates updated consistently whenever attack board moves/rotates

3) Coordinate transformation helpers
- Goal: centralize passenger remapping logic for identity vs 180° rotations.
- Add new module:
  - src/engine/world/coordinatesTransform.ts (or extend existing coordinates.ts if present)
  - Functions:
    - translatePassenger(file, rank, fromPin, toPin) -> {file, rank}
    - rotatePassenger180(file, rank, fromPin, toPin, isQueenLine) -> {file, rank}
- Refactor:
  - src/engine/world/worldMutation.ts: executeBoardMove passenger remap to use the above helpers
  - Keep mapping identical to current behavior validated by tests

4) Expanded activation validation details
- Goal: implement full Phase III validation semantics (controller/direction nuances, king safety scaffolding).
- Where:
  - src/engine/world/worldMutation.ts: validateActivation
- Implement:
  - Direction restrictions when passengers present:
    - No “backward” movement for occupied passenger sets
    - Side moves allowed only if not increasing distance from away-level
  - Controller selection:
    - Occupied: passenger color controls
    - Unoccupied: inherent track controller (from docs)
  - Keep king safety as current stub unless tests exist; add TODO

5) Passenger helpers and movedByAB semantics
- Goal: consistent passenger selection and tracking updates.
- Where:
  - Consider new helpers in worldMutation.ts or a new passenger.ts:
    - getPassengerPieces(boardId, fromPinId, pieces) [reuse existing if present]
    - updatePassengerTracking(piece): set hasMoved, movedByAB for pawns on activation
- Ensure:
  - executeActivation updates movedByAB for pawns
  - No changes to non-passenger pieces

6) Instance-based accessibility
- Goal: movement generation respects instance accessibility (Phase III migration).
- Where:
  - src/store/gameStore.ts:
    - getActiveInstance(boardId) already present; ensure consumers use it
    - getValidMovesForSquare (if exists): ensure it respects only accessible instances
- Notes:
  - If accessibility scaffolding exists in visibility.ts, wire it similarly to isVisible

7) Tests to add/update
- New tests:
  - src/engine/world/__tests__/activationValidation.test.ts
    - adjacency, occupancy, direction with passenger, controller selection, king safety placeholder
  - src/engine/world/__tests__/activationExecution.test.ts
    - TrackState changes, visibility toggling via updateInstanceVisibility, activeInstanceId correctness, movedByAB
  - src/engine/world/__tests__/coordinateHelpers.test.ts
    - translatePassenger and rotatePassenger180 for both tracks
- Update existing tests minimally:
  - src/engine/world/__tests__/boardMovement.test.ts
    - After move/rotate, assert attackBoardStates[boardId].activeInstanceId set correctly
  - Keep current boardMovement semantics passing (backward compatibility)

8) Wiring order and careful integration
- Sequence for moveAttackBoard:
  1. validateActivation
  2. executeActivation -> updatedPieces, updatedPositions, activeInstanceId
  3. Update state: pieces, attackBoardPositions, attackBoardStates[boardId].activeInstanceId
  4. Update trackStates
  5. Call updateInstanceVisibility(world, trackStates)
- Sequence for rotateAttackBoard:
  - Same, with fromPin == toPin and rotate=true

9) Manual smoke test (optional)
- npm run dev
- Move/rotate attack boards using UI controls
- Verify only four instances are visible per trackStates, and passenger remaps still match tests

Open Questions / Assumptions
- King safety is currently a placeholder in validation; implement deeper once core activation passes tests
- Accessibility model beyond visibility not yet enforced in move generation; acceptable for initial Phase III
- attackBoardPositions retained for persistence compatibility

How to proceed (for next session)
- Implement Steps 1–3 first (visibility, TrackStates, helpers), ensure compile/tests pass
- Add tests in Step 7 incrementally; run focused suites during dev
- Then expand validateActivation (Step 4), add passenger tracking refinements (Step 5)
- Push commits to branch devin/1760055586-phase-3-activation-migration and update PR #37
# Phase 7 UI Plan Summary

What’s accomplished (PR #37)
- Activation API wrappers: validateActivation/executeActivation; store calls migrated; activeInstanceId tracked.
- Adjacency typing fixes; CI green.

Next steps to implement
- Engine/helpers:
  - calculateArrivalCoordinates, getArrivalOptions, validateArrivalSquares.
  - executeActivation(arrivalChoice) and movedByAB updates.
- Store:
  - After executeActivation, set trackStates and call updateInstanceVisibility(world, trackStates).
  - Add UI state: selectedAttackBoard, eligiblePins, arrivalOptions, interactionMode.
  - Actions: computeEligiblePins, selectPin, finalizeActivation, clearSelection.
- UI:
  - Use existing center disks for selection.
  - Pin markers with eligibility reasons.
  - ArrivalOverlay for identity/rot180 choice.

Verification
- Add unit tests for eligiblePins and arrivalOptions helpers.
- Extend boardMovement tests to assert attackBoardStates.activeInstanceId and visibility toggling via updateInstanceVisibility.


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
