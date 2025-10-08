# Attack Board Movement Debugging Plan

Goal
- Ensure engine validation for attack board moves precisely matches the rules documented in ATTACK_BOARD_RULES.md, including:
  - Pin adjacency (per-JSON map)
  - requiresEmpty/backward-only constraints
  - Rotation constraints (≤ 1 passenger)
  - Vertical shadow blocking
  - Exclusion of current pin and non-adjacent pins

Problem Summary
- Documented JSON in ATTACK_BOARD_RULES.md defines allowed edges per pin with dir and requiresEmpty.
- Engine validateBoardMove applies multiple layers: adjacency, occupancy/passenger count, vertical shadow, rotation rules, and king-safety.
- Discrepancy was observed: some backward-only edges still validate as legal when we intend to simulate an occupied board. Root cause is typically test-world setup: the engine only treats a board as “occupied” when at least one piece is on the moving board’s 2x2 squares at the source pin, and passenger detection uses PIN_POSITIONS to determine those squares. Placing passengers incorrectly or letting other boards sit on destination pins can mask or flip expectations.

High-Level Strategy
1) Create a JSON-driven test suite that:
   - Parses the JSON map from ATTACK_BOARD_RULES.md
   - For each fromPin, verifies exactly the listed to pins are allowed on an empty board
   - For backward-only edges with requiresEmpty=true, verifies they are disallowed when the board is occupied
   - Avoids false test failures by ensuring:
     - No other attack board occupies the destination pin
     - For occupied cases, place a passenger square on WQL’s 2x2 area derived from PIN_POSITIONS[fromPin]

2) Manually verify in-app with “Kings Only” saved game via localStoragePersistence:
   - Load the app, trigger the seeded Kings Only game
   - Interactively attempt each adjacency and observe highlights/eligibility
   - Confirm rotation only allowed with ≤ 1 passenger
   - Confirm vertical shadow blocking by placing/removing blocking pieces vertically

3) If mismatches surface, isolate the validation layer:
   - Adjacency mismatches: compare ATTACK_BOARD_ADJACENCY vs ATTACK_BOARD_RULES.md; fix code or doc after confirming intent
   - Occupancy/backward rules: confirm isBoardOccupied logic and passenger detection (PIN_POSITIONS alignment)
   - Vertical shadow: verify board z-heights, shadow path computation, and special-case exceptions
   - Rotation: verify <= 1 passenger gating in validateRotate or validateBoardMove

Deliverables so far
- Test suite: src/engine/world/__tests__/attackBoardAdjacencyFromDocs.test.ts
  - Parses JSON adjacency embedded in ATTACK_BOARD_RULES.md and validates:
    - Empty-board: exact destinations allowed
    - Occupied: backward-only edges with requiresEmpty=true are disallowed when one passenger is present
- Manual verification: Kings Only loaded via LocalStoragePersistence; lower-left controls exercised.

What’s been tried (app-level)
- Selected WKL using lower-left controls and executed moves via the lower-left pin buttons.
- Sequences tested: KL1→KL2→KL3→KL4; attempted QL pins when eligible; tried rotation.
- Findings:
  - White king stays visible after board moves and rotations in my runs (no consistent “disappearing king” reproduction yet).
  - Turn does NOT transfer after board moves (indicator remains “Move: White”).
  - Lower-left pin buttons accurately reflect eligibility/tooltip reasons (occupancy, adjacency, vertical shadow).
  - Could not consistently reproduce a Z “shoot up” yet; observed expected elevation changes between level buckets.

What’s been tried (code reading)
- worldMutation.ts:
  - validateBoardMove applies rotation, adjacency (ATTACK_BOARD_ADJACENCY), occupancy (destination occupied), vertical shadow, king safety (stubbed true).
  - executeBoardMove offsets passengers and updates pieces/positions, but does NOT toggle turns.
- gameStore.ts:
  - moveAttackBoard calls validateBoardMove and executeBoardMove, pushes moveHistory, updates positions/pieces, calls updateAttackBoardWorld for z/rotation visualization.
  - No turn toggle occurs in moveAttackBoard; explains “turn does not transfer.”
  - updateAttackBoardWorld computes z by coarse level buckets -> mainZ + ATTACK_OFFSET; ignores pin.zHeight, which may cause z inconsistencies if expectations rely on exact pin.zHeight.
- pinPositions.ts:
  - Contains fileOffset/rankOffset, level, and zHeight per pin; zHeight reflects more granular expected z placement than the store currently uses.
- LocalStoragePersistence:
  - Seeds “Kings Only” with white king on WKL at KL1 and black king on BKL at KL6.

Open issues reproduced/observed
- Turn not transferring after any attack-board move (lower-left buttons and otherwise).
- Inconsistent reproduction of “king disappears” and “board shoots up on z” reported by user when clicking lower-left coordinate buttons; need exact sequence to reproduce reliably.

Hypotheses
1) Turn toggle missing for attack-board moves:
   - moveAttackBoard should advance turn after a successful board move; currently does not.
2) Z-axis jump via lower-left controls:
   - updateAttackBoardWorld uses level buckets rather than pin.zHeight; when moving between pins with ATTACK_OFFSET vs base plane, the perceived jump might not match pin.zHeight expectations.
   - Alternatively, the lower-left handler could be passing the wrong context (fromPin/toPin rotation) or using a stale selectedBoardId.
3) “King disappears”:
   - Passenger detection uses getBoardSquaresForBoardAtPin(boardId, fromPinId) and piece.level === boardId. If a move changes boardId/level or evaluates passenger set before selection state stabilizes, the king might not be included, leading to a momentary render drop until next state update.
   - Another possibility is that the lower-left button click triggers a different code path or a duplicate update where piece level/file/rank diverge until world squares update.

Concrete next steps (for the next Devin)
A) Instrumentation (temp logs or test-only debug payloads)
- In gameStore.moveAttackBoard (and rotateAttackBoard):
  - Log before/after: {boardId, fromPinId, toPinId, rotate, currentTurn}
  - After executeBoardMove: passenger count detected in worldMutation; king piece before/after (file, rank, level).
  - Log whether a turn toggle is invoked.
- In worldMutation.executeBoardMove:
  - Log passengerPieces.length and ids; piece-level/file/rank remapping results for king.
- In updateAttackBoardWorld:
  - Log pin.id, pin.level, pin.zHeight, computed attackBoardZ.
  - Consider switching to use pin.zHeight directly for worldZ and board.centerZ to eliminate level-bucket discrepancies.

B) Minimal fixes to validate hypotheses
- Turn toggle:
  - After a successful board move in moveAttackBoard, toggle currentTurn to the other color, then call updateGameState to recompute check/checkmate/stalemate. Capture this in a separate commit for review.
- Z-axis:
  - Replace level-bucket logic with direct use of PIN_POSITIONS[pinId].zHeight. Verify visually that KL1/QL1/… align with expected heights and no “shoot up.”
- Passenger robustness:
  - Ensure selection state changes don’t race with passenger detection. If needed, use a functional set() to update pieces and positions in a single transaction; verify passenger detection uses the fromPinId captured before set state mutation.

C) Reproduction script/steps
- Load “Kings Only.”
- Select WKL from lower-left controls.
- Click lower-left QL1 (or provide exact sequence that previously caused the issue).
- Observe:
  - King visibility immediately after click.
  - Board Z vs expected zHeight.
  - Move History entry presence.
  - Turn transfer to Black.
- Compare with clicking the in-scene RailPins to see if bug is isolated to lower-left controls.

D) Tests to add/adjust
- Add unit test to confirm executeBoardMove remaps passengers correctly for both rotation states and for QL↔KL transitions.
- Add selector-level test to ensure UI eligiblePins set matches validateBoardMove for the selected board/pin state.
- If we switch to pin.zHeight in updateAttackBoardWorld, add a thin test to assert world squares’ worldZ equals pin.zHeight for attack boards.

Contingency
- If “king disappears” remains elusive, add a debug overlay listing all pieces and their (file, rank, level) after each board move to cross-check render vs state.
- If the lower-left control path differs from RailPins, unify handlers to a single moveAttackBoard invocation path.

Summary of actionable items
- Implement turn toggle after board moves.
- Consider using pin.zHeight directly for attack-board world Z.
- Add logs around move execution and world updates to catch any passenger/level mismatches.
- Continue reproducing the lower-left-button sequence; capture exact click path that triggers disappearance/z jump if possible.


# Attack Board Movement Debugging Plan

Goal
- Ensure engine validation for attack board moves precisely matches the rules documented in ATTACK_BOARD_RULES.md, including:
  - Pin adjacency (per-JSON map)
  - requiresEmpty/backward-only constraints
  - Rotation constraints (≤ 1 passenger)
  - Vertical shadow blocking
  - Exclusion of current pin and non-adjacent pins

Problem Summary
- Documented JSON in ATTACK_BOARD_RULES.md defines allowed edges per pin with dir and requiresEmpty.
- Engine validateBoardMove applies multiple layers: adjacency, occupancy/passenger count, vertical shadow, rotation rules, and king-safety.
- Discrepancy was observed: some backward-only edges still validate as legal when we intend to simulate an occupied board. Root cause is typically test-world setup: the engine only treats a board as “occupied” when at least one piece is on the moving board’s 2x2 squares at the source pin, and passenger detection uses PIN_POSITIONS to determine those squares. Placing passengers incorrectly or letting other boards sit on destination pins can mask or flip expectations.

High-Level Strategy
1) Create a JSON-driven test suite that:
   - Parses the JSON map from ATTACK_BOARD_RULES.md
   - For each fromPin, verifies exactly the listed to pins are allowed on an empty board
   - For backward-only edges with requiresEmpty=true, verifies they are disallowed when the board is occupied
   - Avoids false test failures by ensuring:
     - No other attack board occupies the destination pin
     - For occupied cases, place a passenger square on WQL’s 2x2 area derived from PIN_POSITIONS[fromPin]

2) Manually verify in-app with “Kings Only” saved game via localStoragePersistence:
   - Load the app, trigger the seeded Kings Only game
   - Interactively attempt each adjacency and observe highlights/eligibility
   - Confirm rotation only allowed with ≤ 1 passenger
   - Confirm vertical shadow blocking by placing/removing blocking pieces vertically

3) If mismatches surface, isolate the validation layer:
   - Adjacency mismatches: compare ATTACK_BOARD_ADJACENCY vs ATTACK_BOARD_RULES.md; fix code or doc after confirming intent
   - Occupancy/backward rules: confirm isBoardOccupied logic and passenger detection (PIN_POSITIONS alignment)
   - Vertical shadow: verify board z-heights, shadow path computation, and special-case exceptions
   - Rotation: verify <= 1 passenger gating in validateRotate or validateBoardMove

Detailed Step-by-Step Plan

A) Tight-loop Unit Tests
- Parse docs JSON:
  - Extract “Map as structured JSON” block from ATTACK_BOARD_RULES.md
  - JSON.parse into Record&lt;pin, edges[]&gt;

- Empty-board adjacency test:
  - Build world via createChessWorld
  - For each fromPin: compute allowed set from JSON
  - For each toPin (excluding same): call validateBoardMove with
    - boardId=WQL
    - attackBoardPositions chosen so no other attack board sits on toPin
    - pieces=[]
  - Expect isValid to match allowed set membership

- Occupied/backward-only test:
  - For each fromPin:
    - Place exactly one passenger piece on a square that belongs to WQL’s 2x2 footprint at fromPin using PIN_POSITIONS[fromPin].rankOffset and fileOffset (fileOffset 0 for QL, 4 for KL)
    - Ensure other boards avoid toPin
    - For each JSON edge where dir=[“backward”] and requiresEmpty=true: expect validateBoardMove(...).isValid === false

- Additional negative checks (optional if needed):
  - Non-adjacent toPins should be invalid on empty board
  - Current pin excluded

B) App Manual Verification (Kings Only)
- Locate the localStorage seeded Kings Only state in src/persistence/localStoragePersistence.ts
- npm run dev
- Reload page to seed default saves; load Kings Only
- For each source pin:
  - Select WQL/WKL/BQL/BKL on the current pin and verify UI highlights match JSON edges
  - Add/remove one passenger on the board to verify requiresEmpty/backward behavior toggles as documented
  - Test rotation eligibility toggles at 0 vs 1 passenger and fails at 2+
  - Set up a vertical blocker below/above a destination quadrant to verify vertical shadow disallows move
- Note any mismatches: capture which pin and which rule failed

C) Root-Cause Isolation and Fixes
- If empty-board adjacency mismatches:
  - Compare ATTACK_BOARD_ADJACENCY.ts vs docs JSON
  - If code is wrong: update ATTACK_BOARD_ADJACENCY and adjust validateAdjacency
  - If docs are outdated: propose doc update and confirm before changing docs/tests

- If backward-only/occupied mismatches:
  - Inspect passenger detection:
    - Ensure we’re using PIN_POSITIONS[fromPin] to place a passenger square squarely on the moving board
    - Verify level/boardId/world transforms are consistent (WQL vs WKL file offsets)
  - Inspect validateAdjacency requiresEmpty enforcement path

- If vertical shadow mismatches:
  - Confirm z-height mapping (Z_WHITE_MAIN, Z_NEUTRAL_MAIN, Z_BLACK_MAIN, ATTACK_OFFSET)
  - Check ray/segment calculation for vertical path; ensure no off-by-one on square inclusion

- If rotation constraints mismatches:
  - Verify canRotate/canMoveBoard gating in gameStore and worldMutation
  - Enforce passenger count threshold exactly at ≤ 1

Contingency Approaches

If JSON parsing from docs becomes brittle:
- Fall back to importing ATTACK_BOARD_ADJACENCY.ts as the authoritative set and add a separate doc-vs-code consistency test that diff-checks the two structures and prints a helpful failure
- Keep the primary engine tests using the code adjacency table to limit brittleness, while still catching divergence with a separate consistency test

If occupancy detection remains flaky in tests:
- Instrument validateBoardMove to return a debug payload (behind a test-only flag or separate function) indicating:
  - which validations passed/failed
  - passenger count detected
  - vertical shadow result
- Use this only in tests to verify the precise reason a move passed/failed

If vertical shadow is hard to test deterministically:
- Add a dedicated unit for vertical shadow path calculation with fixed fixtures (known blocker piece positions, expected blocked/unblocked results)
- Keep move-validation tests simple (just verify a blocked case and an unblocked case)

If UI highlights deviate while engine validation is correct:
- Trace the UI eligibility computation to ensure it sources from validateBoardMove or equivalent derived selector
- Add a small integration test for the selector responsible for highlighting eligible pins, comparing it against validateBoardMove outcomes

Deliverables
- Test suite: src/engine/world/__tests__/attackBoardAdjacencyFromDocs.test.ts
- Manual verification notes from Kings Only
- Fixes (if required) in:
  - src/engine/world/attackBoardAdjacency.ts
  - src/engine/world/worldMutation.ts
  - src/engine/world/pinPositions.ts (if mapping is wrong)
  - reference_docs/ATTACK_BOARD_RULES.md (only if docs are wrong)
- PR to main with:
  - Summary of test coverage and results
  - Notes on any fixes and manual verification outcomes
  - Link to this Devin run and @wpettine

Verification Checklist
- Empty-board adjacency: exact match with docs JSON
- Occupied/backward-only: edges with requiresEmpty=true disallowed when ≥1 passenger on board
- Current pin excluded; non-adjacent invalid
- Rotation only with ≤1 passenger
- Vertical shadow correctly blocks/unblocks
- All tests pass and lint clean
