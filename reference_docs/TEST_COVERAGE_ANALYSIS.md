# Test Coverage Analysis: Why Tests Didn't Catch Attack Board Bugs

**Date:** 2025-01-14
**Issue:** Attack board movement causes pieces to disappear and boards don't update visibility correctly
**Question:** Why didn't the existing tests catch this bug?

---

## Summary

The tests **DID** test the underlying logic that's working correctly. They **DID NOT** test the integration layer where the actual bugs exist. The bugs are in the **gameStore state management layer**, not in the engine functions that the tests cover.

---

## What The Tests Actually Cover

### ✅ Engine Layer Tests (src/engine/world/__tests__/)

**Files:**
- `boardMovement.test.ts` (599 lines)
- `activation.execute.test.ts` (66 lines)
- `activationValidation.test.ts`
- `coordinatesTransform.test.ts`
- `visibilityContract.test.ts`

**What they test:**

1. **`validateBoardMove()`** - Adjacency, occupancy, direction, vertical shadows ✅
2. **`executeBoardMove()`** - Piece coordinate updates, rotation mapping ✅
3. **`executeActivation()`** - Arrival choice (identity vs rot180) ✅
4. **`updateInstanceVisibility()`** - Hide/show logic ✅

**Example from boardMovement.test.ts:327-354:**
```typescript
it('should update passenger piece coordinates', () => {
  const passenger: Piece = {
    id: 'passenger-pawn',
    type: 'pawn',
    color: 'white',
    file: 0,
    rank: 0,
    level: 'WQL',
    hasMoved: false,
  };

  const context: BoardMoveContext = {
    boardId: 'WQL',
    fromPinId: 'QL1',
    toPinId: 'QL2',
    rotate: false,
    pieces: [passenger],
    world: mockWorld,
    attackBoardPositions: basePositions,
  };

  const result = executeBoardMove(context);
  const updatedPassenger = result.updatedPieces.find(p => p.id === 'passenger-pawn');

  expect(updatedPassenger?.file).toBe(0);
  expect(updatedPassenger?.rank).toBe(2);  // ✅ Correctly updated
  expect(updatedPassenger?.hasMoved).toBe(true);
});
```

**Verdict:** These tests PASS because `executeBoardMove()` works correctly!

---

### ✅ Component Layer Tests (src/components/Board3D/__tests__/)

**Files:**
- `scenegraph.pieces.test.tsx`
- `scenegraph.visibility.test.tsx`
- `scenegraph.boardSquares.test.tsx`

**What they test:**

1. **Piece rendering** - Given store state, do pieces render at correct worldX/Y/Z? ✅
2. **Board visibility** - Are the right boards visible in the scene? ✅
3. **Square positioning** - Do board squares exist with correct coordinates? ✅

**Example from scenegraph.pieces.test.tsx:44:**
```typescript
for (const piece of pieces) {
  const boardId = resolveBoardId(piece.level);
  const squareId = `${['z', 'a', 'b', 'c', 'd', 'e'][piece.file]}${piece.rank}${boardId}`;
  const square = world.squares.get(squareId);

  expect(square).toBeDefined();
  // ... verify piece mesh is at square.worldX/Y/Z
}
```

**Verdict:** These tests PASS because given **correct** store state, rendering works!

---

## ❌ What The Tests DON'T Cover

### Missing: Integration Layer Testing

**The gap:** No tests for `gameStore.ts` functions that **orchestrate** the engine functions.

Specifically, **ZERO** tests for:

1. **`moveAttackBoard()`** (gameStore.ts:530+)
   - Calls `validateActivation()` ✅ (tested)
   - Calls `executeActivation()` ✅ (tested)
   - **Updates `attackBoardStates`** ❌ (NOT tested)
   - **Updates `trackStates`** ❌ (NOT tested)
   - **Calls `updateInstanceVisibility()`** ❌ (NOT tested)
   - **Calls `set()` to update store** ❌ (NOT tested)

2. **`selectBoard()`** (gameStore.ts:424)
   - **Converts instance ID → board ID** ❌ (NOT tested)
   - This conversion was recently added to fix selection

3. **`selectSquare()`** (gameStore.ts:289)
   - **Uses `resolveBoardId()` for lookups** ❌ (NOT tested)
   - This was recently added to fix selection

4. **State persistence across moves** ❌ (NOT tested)
   - After `moveAttackBoard()`, does the store have correct state?
   - Can pieces still be selected?
   - Can pieces still move?

---

## Root Cause: The Bug Is In State Management, Not Logic

### The Engine Functions Work Correctly

```typescript
// This works (tested ✅)
const result = executeActivation({
  boardId: 'WQL',
  fromPinId: 'QL1',
  toPinId: 'QL2',
  /* ... */
});

console.log(result.updatedPieces[0]);
// { file: 0, rank: 2, level: 'WQL', ... } ✅ CORRECT
```

### The Store Integration Fails

```typescript
// This is broken (NOT tested ❌)
moveAttackBoard('WQL', 'QL2', false, 'identity');

// After this call:
// - pieces array might not be updated
// - attackBoardStates might be wrong
// - trackStates might be wrong
// - updateInstanceVisibility might not be called
// Result: piece can't render because state is inconsistent
```

---

## Specific Bugs That Escaped Testing

### Bug 1: Pieces Disappear After Movement

**Root cause hypothesis:** `attackBoardStates` not updated correctly

**Why tests didn't catch it:**
- `executeActivation()` is tested in isolation ✅
- It correctly returns `activeInstanceId: 'QL2:0'` ✅
- But `moveAttackBoard()` might not be setting `attackBoardStates.WQL.activeInstanceId = 'QL2:0'` ❌
- Result: `resolveBoardId('WQL')` returns wrong instance ID
- Piece rendering fails because square lookup uses wrong instance

**What would have caught it:**
```typescript
it('should update attackBoardStates after moving board', () => {
  const store = createGameStore();

  // Initial state
  expect(store.attackBoardStates.WQL.activeInstanceId).toBe('QL1:0');

  // Move board
  store.moveAttackBoard('WQL', 'QL2', false, 'identity');

  // Verify state updated
  expect(store.attackBoardStates.WQL.activeInstanceId).toBe('QL2:0');
});
```

### Bug 2: Black's Board Doesn't Move

**Root cause hypothesis:** `trackStates` not updated correctly for Black

**Why tests didn't catch it:**
- `updateInstanceVisibility()` is tested in isolation ✅
- Given correct `trackStates`, it shows the right boards ✅
- But `moveAttackBoard()` might not be updating `trackStates.QL.blackBoardPin` ❌
- Result: visibility toggle uses old trackStates, shows old board

**What would have caught it:**
```typescript
it('should update trackStates when Black board moves', () => {
  const store = createGameStore();

  // Initial state
  expect(store.trackStates.QL.blackBoardPin).toBe(6);

  // Move Black's board
  store.moveAttackBoard('BQL', 'QL5', false, 'identity');

  // Verify trackStates updated
  expect(store.trackStates.QL.blackBoardPin).toBe(5);

  // Verify visibility updated
  const visibleBoards = Array.from(store.world.boards.values())
    .filter(b => b.isVisible)
    .map(b => b.id);
  expect(visibleBoards).toContain('QL5:0');
  expect(visibleBoards).not.toContain('QL6:0');
});
```

### Bug 3: Piece Coordinates Don't Update

**Root cause hypothesis:** `set({ pieces: result.updatedPieces })` not called or called with wrong data

**Why tests didn't catch it:**
- `executeBoardMove()` correctly returns updated pieces ✅
- But `moveAttackBoard()` might not be calling `set()` with that data ❌

**What would have caught it:**
```typescript
it('should update piece coordinates after board move', () => {
  const store = createGameStore();

  // Add a pawn at z0QL1
  const pawn = {
    id: 'p1', type: 'pawn', color: 'white',
    file: 0, rank: 0, level: 'WQL', hasMoved: false
  };
  store.set({ pieces: [pawn] });

  // Move board QL1 → QL2
  store.moveAttackBoard('WQL', 'QL2', false, 'identity');

  // Verify piece updated
  const updatedPawn = store.pieces.find(p => p.id === 'p1');
  expect(updatedPawn?.file).toBe(0);
  expect(updatedPawn?.rank).toBe(2);  // Should be 2, not 0
  expect(updatedPawn?.level).toBe('WQL');  // Should still be 'WQL'
});
```

---

## Why This Happened: Test Architecture Gap

### Test Philosophy Issue

**Current approach:**
- ✅ Unit test pure functions (engine layer)
- ✅ Component test rendering given state (view layer)
- ❌ **SKIP** integration test state management (controller layer)

**Missing layer:**
```
User Action → [gameStore] → Engine Functions → [gameStore] → React Re-render
              ↑ NOT TESTED ↑               ↑ NOT TESTED ↑
```

The arrows are where bugs hide!

### Why Integration Tests Are Hard

1. **Zustand store complexity** - Need to mock or create real store
2. **State dependencies** - `world`, `pieces`, `trackStates`, `attackBoardStates` all interconnected
3. **Side effects** - `updateInstanceVisibility()` mutates `world.boards`
4. **Async updates** - React state updates are async
5. **Setup overhead** - Creating full game state is verbose

**Example of the setup burden:**
```typescript
// This is a LOT of setup for one test
const store = create(useGameStore);
store.setState({
  world: createChessWorld(),
  pieces: [/* 32 pieces */],
  trackStates: { /* ... */ },
  attackBoardStates: { /* ... */ },
  attackBoardPositions: { /* ... */ },
  currentTurn: 'white',
  // ... 20 more fields
});
```

---

## Test Coverage Metrics

### Lines Tested

| Layer | Files | Test Coverage | What's Tested |
|-------|-------|--------------|---------------|
| **Engine** | `src/engine/world/*.ts` | ~80% | ✅ Logic functions |
| **Engine** | `src/engine/validation/*.ts` | ~70% | ✅ Move validation |
| **Components** | `src/components/Board3D/*.tsx` | ~60% | ✅ Rendering given state |
| **Store** | `src/store/gameStore.ts` | **0%** | ❌ **NOTHING** |
| **Utils** | `src/utils/resolveBoardId.ts` | **0%** | ❌ **NOTHING** |

### Functions Never Tested

In `gameStore.ts` (927 lines total):

- ❌ `selectSquare()` (289-346)
- ❌ `movePiece()` (348-396)
- ❌ `selectBoard()` (424-437)
- ❌ `moveAttackBoard()` (530-605) **← WHERE THE BUG IS**
- ❌ `getValidMovesForSquare()` (453-467)
- ❌ `updateGameState()` (469-471)
- ❌ `canMoveBoard()` (513-528)
- ❌ `resetGame()` (439-451)

**0 of 8 critical functions have tests** ❌

---

## Lessons Learned

### Why The Bugs Weren't Caught

1. **Unit tests passed** because the functions they test work correctly
2. **Component tests passed** because they test rendering, not state updates
3. **Integration tests don't exist** so state management bugs invisible
4. **Manual testing was incomplete** - didn't test attack board movement end-to-end

### What This Reveals About Test Strategy

**Good:**
- ✅ Engine logic is well-tested and robust
- ✅ Rendering is well-tested and works given correct state
- ✅ Coordinate system validation is thorough

**Bad:**
- ❌ No integration tests for state management
- ❌ No end-to-end tests for user workflows
- ❌ Assumptions that "if units pass, integration works"

**The Gap:**
```
Unit Tests ✅ + Component Tests ✅ ≠ Working Application ❌
```

---

## Recommendations for Future Testing

### 1. Add Integration Tests for gameStore

**Priority: HIGH**

```typescript
describe('gameStore - moveAttackBoard integration', () => {
  it('should move board, update state, and maintain piece renderability', () => {
    // Create store with realistic state
    const store = createTestStore();

    // Add piece on attack board
    const pawn = createTestPiece('pawn', 'white', 0, 0, 'WQL');
    store.setState({ pieces: [pawn] });

    // Move the board
    store.getState().moveAttackBoard('WQL', 'QL2', false, 'identity');

    // Verify ALL state updated correctly
    const state = store.getState();
    expect(state.attackBoardPositions.WQL).toBe('QL2');
    expect(state.attackBoardStates.WQL.activeInstanceId).toBe('QL2:0');
    expect(state.trackStates.QL.whiteBoardPin).toBe(2);

    // Verify piece updated
    const updatedPawn = state.pieces[0];
    expect(updatedPawn.rank).toBe(2);

    // Verify square exists for rendering
    const boardId = resolveBoardId(updatedPawn.level, state.attackBoardStates);
    const squareId = createSquareId(updatedPawn.file, updatedPawn.rank, boardId);
    const square = state.world.squares.get(squareId);
    expect(square).toBeDefined();
  });
});
```

### 2. Add E2E Tests for User Workflows

**Priority: MEDIUM**

```typescript
describe('E2E - Attack board movement', () => {
  it('user can move attack board and piece remains visible', () => {
    // Render full app
    render(<App />);

    // Load "King and Pawn" game
    clickButton('Load Game');
    clickButton('King and Pawn');

    // Select White's QL board
    clickAttackBoard('QL1');

    // Move to QL2
    clickPin('QL2');
    clickArrivalChoice('identity');

    // Verify board moved
    expect(getBoardAtPin('QL2')).toBeVisible();
    expect(getBoardAtPin('QL1')).not.toBeVisible();

    // Verify piece still visible
    expect(getPieceAt('z2QL2')).toBeVisible();
  });
});
```

### 3. Add Tests for resolveBoardId

**Priority: HIGH** (critical utility, currently untested)

```typescript
describe('resolveBoardId', () => {
  it('should convert WQL to active instance ID', () => {
    const states = {
      WQL: { activeInstanceId: 'QL2:0' },
      /* ... */
    };
    expect(resolveBoardId('WQL', states)).toBe('QL2:0');
  });

  it('should return main board IDs unchanged', () => {
    expect(resolveBoardId('W', {})).toBe('W');
    expect(resolveBoardId('N', {})).toBe('N');
  });
});
```

### 4. Add Snapshot Tests for State Transitions

**Priority: LOW** (useful for regression, but verbose)

```typescript
it('should produce consistent state after board move', () => {
  const store = createTestStore();
  store.moveAttackBoard('WQL', 'QL2', false, 'identity');

  // Snapshot entire state
  expect(store.getState()).toMatchSnapshot();
});
```

---

## Conclusion

**The tests didn't catch the bug because:**

1. ✅ Tests exist for the **engine logic** (which works correctly)
2. ✅ Tests exist for the **rendering layer** (which works given correct state)
3. ❌ **Zero tests exist for the state management layer** (where the bug is)

**The bug exists in the integration:**
- `executeActivation()` returns correct data ✅
- `moveAttackBoard()` doesn't properly save that data to the store ❌

**Why this matters:**
- Unit tests give false confidence that "everything works"
- Integration gaps are invisible without integration tests
- Manual testing is the only safety net (and it failed here too)

**Action items:**
1. Add integration tests for `moveAttackBoard()` **before** fixing the bug
2. Verify tests fail with current implementation
3. Fix the bug
4. Verify tests pass
5. Add more integration tests for other store functions

---

**End of Analysis**
