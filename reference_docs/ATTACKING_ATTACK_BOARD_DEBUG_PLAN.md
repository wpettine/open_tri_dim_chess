# Attack Board Attack Debug Plan

## Problem Statement

A bishop at position `d5N` cannot attack a pawn at position `a8QL6:0`, even though this should be a valid diagonal move. The move is not appearing in the legal moves list.

### Expected Behavior
- Bishop at d5N (file=4, rank=5, level=N)
- Target: a8QL6:0 (file=1, rank=8, level=QL6:0)
- File change: 3, Rank change: 3 → Valid file-rank diagonal ✓
- Colors: (4+5)%2=1 (light), (1+8)%2=1 (light) → Same color ✓
- Should be a legal move

### Actual Behavior
The move to `a8QL6:0` (and `a8QL6:180`) does not appear in the legal moves list at all.

### Additional Evidence
Debug logging added to `validateBishopMove()` is not appearing in console, suggesting the function may not be called for QL6 squares, or QL6 squares are filtered out before validation.

---

## Root Cause Hypotheses

### Hypothesis 1: Attack Board Squares Not Included in Iteration
**Theory:** `getLegalMoves()` iterates over `world.squares`, but QL6 squares may be filtered out based on visibility or accessibility flags.

**Evidence needed:**
- Check if QL6 squares exist in `world.squares` map
- Check if QL6 board instances have correct visibility/accessibility flags
- Verify iteration includes attack board squares

**Investigation:**
- Add logging at start of `getLegalMoves()` to count total squares being considered
- Add logging to show which QL6 squares exist in world
- Check if attack board state affects square iteration

### Hypothesis 2: Attack Board Visibility/Accessibility Filtering
**Theory:** The game may filter squares based on attack board `isVisible` or `isAccessible` flags before validation occurs.

**Evidence needed:**
- Examine how attack board states are resolved
- Check if there's filtering in `getLegalMoves()` before validation
- Verify `resolveBoardId()` correctly handles QL6

**Investigation:**
- Trace `attackBoardStates` parameter usage
- Check `resolveBoardId()` implementation
- Look for any early-return conditions in move generation

### Hypothesis 3: Level Map Missing QL6 Entries
**Theory:** While we fixed the base level ID extraction, the `levelMap` may still be missing QL6 entries for some pins (QL2, QL3, QL4, QL5).

**Evidence needed:**
- Verify levelMap has all 12 attack board entries (QL1-6, KL1-6)
- Check if QL6 specifically is missing

**Investigation:**
- Review `levelMap` in `validateBishopMove()`
- Verify all pins have entries

### Hypothesis 4: Path Validation Blocking Due to Board Gaps
**Theory:** The diagonal path d5N → a8QL6 passes through intermediate coordinates (c6, b7). The coordinate b7 only exists on board B (ranks 5-8), not on N (ranks 3-6) or QL6 (ranks 8-9). Path validation may block because there's no continuous path.

**Evidence needed:**
- Trace path from d5N to a8QL6
- Check which boards have squares at c6 and b7
- Verify path validation logic for cross-level diagonals

**Investigation:**
- Add logging to `getPathCoordinates()` for this specific move
- Check `isCoordinateBlocked()` logic
- Verify handling of paths that cross board boundaries

### Hypothesis 5: Attack Board Track Connectivity Issues
**Theory:** There may be restrictions on moving from main boards (N) to attack boards (QL6) that aren't properly documented.

**Evidence needed:**
- Check if there are special rules for main→attack moves
- Verify track connectivity logic in validation

**Investigation:**
- Review attack board connectivity checks in `validateBishopMove()`
- Check if N→QL6 is considered a "different tracks" scenario

---

## Investigation Strategy

### Phase 1: Confirm Square Existence (15 minutes)
**Goal:** Verify QL6 squares exist in the world and are being considered

**Steps:**
1. Add logging to `getLegalMoves()` at line 22:
   ```typescript
   const legalMoves: string[] = [];
   console.log(`[getLegalMoves] Starting move generation for ${piece.type} at ${fromSquareId}`);
   console.log(`[getLegalMoves] Total squares in world:`, world.squares.size);

   // Count QL6 squares
   let ql6Count = 0;
   for (const [squareId] of world.squares) {
     if (squareId.includes('QL6')) ql6Count++;
   }
   console.log(`[getLegalMoves] QL6 squares available:`, ql6Count);
   ```

2. Add logging inside the iteration loop at line 32:
   ```typescript
   for (const [squareId, square] of world.squares) {
     if (squareId.includes('QL6')) {
       console.log(`[getLegalMoves] Considering QL6 square: ${squareId}`);
     }
     // ... existing code
   }
   ```

3. Observe console output when selecting bishop at d5N

**Expected outcomes:**
- If QL6Count = 0: Attack boards not created properly
- If QL6Count > 0 but "Considering QL6 square" never logs: Squares filtered before validation
- If "Considering QL6 square" logs but no validateBishopMove logs: Validation called but early return

### Phase 2: Trace Validation Flow (20 minutes)
**Goal:** Follow the exact path through validation for a8QL6 squares

**Steps:**
1. Add logging to `validateMoveForPiece()` at line 57:
   ```typescript
   function validateMoveForPiece(
     context: MoveValidationContext,
     attackBoardStates?: AttackBoardStates
   ): MoveResult {
     const { piece, fromSquare, toSquare, allPieces } = context;

     if (toSquare.id.includes('QL6')) {
       console.log(`[validateMoveForPiece] Validating move to QL6: ${fromSquare.id} → ${toSquare.id}`);
     }

     // ... existing code
   ```

2. Add logging for early returns:
   ```typescript
   if (fromSquare.id === toSquare.id) {
     return { valid: false, reason: 'cannot move to same square' };
   }

   const toLevel = parseLevelFromSquareId(toSquare.id);
   const targetOccupant = allPieces.find((p) => {
     const resolvedPieceLevel = resolveBoardId(p.level, attackBoardStates);
     return (
       p.file === toSquare.file &&
       p.rank === toSquare.rank &&
       resolvedPieceLevel === toLevel
     );
   });

   if (targetOccupant && targetOccupant.color === piece.color) {
     if (toSquare.id.includes('QL6')) {
       console.log(`[validateMoveForPiece] QL6 square blocked: occupied by own piece`);
     }
     return { valid: false, reason: 'occupied by own piece' };
   }

   if (toSquare.id.includes('QL6')) {
     console.log(`[validateMoveForPiece] QL6 square passed initial checks, calling validateBishopMove`);
   }
   ```

3. Observe which check fails (if any)

**Expected outcomes:**
- Identifies exactly where validation fails or stops

### Phase 3: Attack Board State Investigation (15 minutes)
**Goal:** Verify attack board visibility and state resolution

**Steps:**
1. Add logging to check attack board states:
   ```typescript
   export function getLegalMoves(
     piece: Piece,
     world: ChessWorld,
     allPieces: Piece[],
     attackBoardStates?: AttackBoardStates,
     trackStates?: TrackStates
   ): string[] {
     console.log(`[getLegalMoves] attackBoardStates:`, attackBoardStates);
     console.log(`[getLegalMoves] trackStates:`, trackStates);

     // ... existing code
   ```

2. Check board visibility in world:
   ```typescript
   const ql6Board = world.boards.get('QL6:0');
   console.log(`[getLegalMoves] QL6:0 board state:`, {
     exists: !!ql6Board,
     isVisible: ql6Board?.isVisible,
     isAccessible: ql6Board?.isAccessible
   });
   ```

3. Verify `resolveBoardId()` for QL6:
   ```typescript
   const testResolve = resolveBoardId('BQL', attackBoardStates);
   console.log(`[getLegalMoves] resolveBoardId('BQL') =`, testResolve);
   ```

**Expected outcomes:**
- Identify if visibility/accessibility flags are blocking

### Phase 4: Path Validation Deep Dive (25 minutes)
**Goal:** Understand path validation failure for d5N → a8QL6

**Steps:**
1. Manually trace the path:
   - From: d5N (file=4, rank=5)
   - To: a8QL6:0 (file=1, rank=8)
   - Path: c6 (file=3, rank=6), b7 (file=2, rank=7)

2. Check which boards have these squares:
   - c6: Exists on N (ranks 3-6) ✓ and B (ranks 5-8) ✓
   - b7: Exists ONLY on B (ranks 5-8) ✓, NOT on N or QL6

3. Add detailed path logging to `isPathClear()`:
   ```typescript
   export function isPathClear(
     fromSquare: WorldSquare,
     toSquare: WorldSquare,
     world: ChessWorld,
     pieces: Piece[]
   ): boolean {
     const pathCoordinates = getPathCoordinates(fromSquare, toSquare);

     console.log(`[isPathClear] Checking path from ${fromSquare.id} to ${toSquare.id}`);
     console.log(`[isPathClear] Path coordinates (${pathCoordinates.length}):`, pathCoordinates);

     for (let i = 0; i < pathCoordinates.length; i++) {
       const coord = pathCoordinates[i];
       const squareIds = getSquareIdsForCoordinate(coord.file, coord.rank, world);
       console.log(`[isPathClear] Coordinate (${coord.file}, ${coord.rank}): ${squareIds.length} squares`, squareIds);

       if (isCoordinateBlocked(coord, world, pieces)) {
         console.log(`[isPathClear] BLOCKED at coordinate (${coord.file}, ${coord.rank})`);
         return false;
       }
     }

     console.log(`[isPathClear] Path is clear`);
     return true;
   }
   ```

4. Check `isCoordinateBlocked()` logic for the b7 coordinate:
   ```typescript
   function isCoordinateBlocked(
     coord: PathCoordinate,
     world: ChessWorld,
     pieces: Piece[]
   ): boolean {
     const squareIdsToCheck = getSquareIdsForCoordinate(coord.file, coord.rank, world);

     console.log(`[isCoordinateBlocked] Checking (${coord.file}, ${coord.rank}), found ${squareIdsToCheck.length} squares`);

     // If there are no squares at this coordinate in the world, the path doesn't exist
     if (squareIdsToCheck.length === 0) {
       console.log(`[isCoordinateBlocked] No squares exist at coordinate (${coord.file}, ${coord.rank}) - path gap detected`);
       return true; // Treat missing squares as blocked
     }

     for (const squareId of squareIdsToCheck) {
       if (isPieceAt(squareId, pieces)) {
         console.log(`[isCoordinateBlocked] BLOCKED by piece at ${squareId}`);
         return true;
       }
     }

     console.log(`[isCoordinateBlocked] Coordinate (${coord.file}, ${coord.rank}) is clear`);
     return false;
   }
   ```

**Expected outcomes:**
- Identify if path validation is the blocker
- Understand if board gaps are the issue

### Phase 5: Level Map Verification (10 minutes)
**Goal:** Ensure all attack board pins are in the level map

**Steps:**
1. Review the levelMap in both `validateBishopMove()` and `validateKnightMove()`:
   ```typescript
   const levelMap: Record<string, number> = {
     W: 0,
     N: 1,
     B: 2,
     QL1: -1,
     QL6: 3,
     KL1: -1,
     KL6: 3,
   };
   ```

2. Check if QL2, QL3, QL4, QL5 are missing
3. Verify the level difference calculation for N → QL6:
   - fromBaseLevelId = "N" → levelMap["N"] = 1
   - toBaseLevelId = "QL6" → levelMap["QL6"] = 3
   - levelDiff = |3 - 1| = 2

4. For diagonal d5N → a8QL6:
   - fileChange = 3, rankChange = 3, levelDiff = 2
   - Check: (fileChange === rankChange && fileChange > 0) → (3 === 3 && 3 > 0) → TRUE ✓

**Expected outcomes:**
- Confirm level map is complete
- Verify diagonal validation logic

---

## Potential Root Causes & Fixes

### Root Cause A: Attack Board Squares Filtered by Visibility
**If:** QL6 squares don't appear in iteration or are skipped

**Fix:**
1. Check if `getLegalMoves()` filters based on board visibility
2. Ensure visible attack boards include all their squares
3. Modify iteration to include all squares regardless of visibility (visibility is for rendering, not move generation)

**Code location:** `src/engine/validation/moveValidator.ts:32`

### Root Cause B: Path Blocked by Board Gap at b7
**If:** Path validation fails because b7 doesn't exist on the intermediate levels

**Fix:**
1. **Option 1:** Modify path validation for 3D diagonal moves to not require continuous board existence
   - Diagonal moves in 3D can "jump" gaps as long as start and end are valid
   - Only check for piece blocking, not square existence

2. **Option 2:** Recognize that file-rank diagonals across levels don't need intermediate square checking
   - The diagonal nature means pieces can't block unless they're on the exact diagonal line
   - Rethink path validation for cross-level diagonals

**Code location:** `src/engine/validation/pathValidation.ts:75-96`

**Proposed fix:**
```typescript
function isCoordinateBlocked(
  coord: PathCoordinate,
  world: ChessWorld,
  pieces: Piece[]
): boolean {
  const squareIdsToCheck = getSquareIdsForCoordinate(coord.file, coord.rank, world);

  // For 3D diagonal moves, missing intermediate squares don't block the path
  // Only actual pieces can block
  if (squareIdsToCheck.length === 0) {
    console.log(`[isCoordinateBlocked] No squares at (${coord.file}, ${coord.rank}) - allowing for 3D diagonal`);
    return false; // Changed from true to false
  }

  for (const squareId of squareIdsToCheck) {
    if (isPieceAt(squareId, pieces)) {
      return true;
    }
  }

  return false;
}
```

### Root Cause C: Missing Level Map Entries
**If:** QL2-5, KL2-5 are missing from levelMap

**Fix:**
Add all attack board pins to the level map:
```typescript
const levelMap: Record<string, number> = {
  W: 0,
  N: 1,
  B: 2,
  QL1: -1,
  QL2: 0.5,  // Between W and N
  QL3: 0,    // Same level as W
  QL4: 2.5,  // Between N and B
  QL5: 1.5,  // Between N and B
  QL6: 3,
  KL1: -1,
  KL2: 0.5,
  KL3: 0,
  KL4: 2.5,
  KL5: 1.5,
  KL6: 3,
};
```

**Code location:** `src/engine/validation/pieceMovement.ts:392-400` and `src/engine/validation/pieceMovement.ts:309-317`

### Root Cause D: Board ID Resolution Issues
**If:** `resolveBoardId()` doesn't correctly map piece levels to attack board instance IDs

**Fix:**
1. Review `resolveBoardId()` implementation
2. Ensure BQL maps to QL6:0 or QL6:180 based on current state
3. Verify consistency between piece.level format and square.id level parsing

**Code location:** `src/utils/resolveBoardId.ts`

---

## Testing Strategy

### Unit Tests to Add

1. **Test: Bishop on main board can attack attack board**
   ```typescript
   it('should allow bishop at d5N to capture enemy at a8QL6', () => {
     const bishop = createPiece('bishop', 'white', 4, 5, 'N');
     const enemy = createPiece('pawn', 'black', 1, 8, 'BQL');
     const context = createContext(bishop, 1, 8, 'QL6:0', [bishop, enemy]);

     const result = validateBishopMove(context);
     expect(result.valid).toBe(true);
   });
   ```

2. **Test: Path validation for cross-board diagonals**
   ```typescript
   it('should allow diagonal paths that cross board gaps', () => {
     const fromSquare = world.squares.get('d5N');
     const toSquare = world.squares.get('a8QL6:0');

     const pathClear = isPathClear(fromSquare, toSquare, world, []);
     expect(pathClear).toBe(true);
   });
   ```

3. **Test: Level map has all pins**
   ```typescript
   it('should have level map entries for all attack board pins', () => {
     // Test in validateBishopMove context
     const pins = ['QL1', 'QL2', 'QL3', 'QL4', 'QL5', 'QL6', 'KL1', 'KL2', 'KL3', 'KL4', 'KL5', 'KL6'];
     for (const pin of pins) {
       // Verify levelMap has entry
     }
   });
   ```

### Integration Tests

1. **Full game scenario:**
   - Set up board with bishop at d5N
   - Place enemy piece at a8QL6
   - Call `getLegalMoves(bishop, world, allPieces, attackBoardStates, trackStates)`
   - Assert a8QL6:0 and/or a8QL6:180 are in the returned array

2. **Multi-level diagonal test:**
   - Test diagonals from each main board to each attack board
   - Verify all valid cross-board diagonals work

### Manual Testing Checklist

After implementing fixes:

1. [ ] Bishop at d5N shows a8QL6:0 in legal moves (if visible)
2. [ ] Bishop at d5N shows a8QL6:180 in legal moves (if visible)
3. [ ] Bishop can execute the capture move
4. [ ] Other cross-board diagonal moves still work (c4N → a2QL3, etc.)
5. [ ] Color rules still enforced (can't move to opposite color)
6. [ ] Path blocking still works (pieces on diagonal block movement)
7. [ ] Attack board visibility correctly affects which instances appear

---

## Implementation Plan

### Step 1: Add Comprehensive Logging
- [ ] Add logging to `getLegalMoves()` (Phase 1)
- [ ] Add logging to `validateMoveForPiece()` (Phase 2)
- [ ] Add logging to `isPathClear()` and `isCoordinateBlocked()` (Phase 4)
- [ ] Add logging to `validateBishopMove()` for QL6 (already done)

**Time:** 30 minutes

### Step 2: Run Debugging Session
- [ ] Start dev server with logging
- [ ] Select bishop at d5N
- [ ] Capture all console output
- [ ] Analyze which hypothesis is correct

**Time:** 15 minutes

### Step 3: Implement Fix Based on Findings
Depending on root cause:

**If visibility filtering (Root Cause A):**
- [ ] Modify square iteration to include all squares
- [ ] Separate visibility (for rendering) from movability

**If path gap blocking (Root Cause B):**
- [ ] Modify `isCoordinateBlocked()` to allow missing squares
- [ ] OR: Add special handling for 3D diagonals

**If missing level map (Root Cause C):**
- [ ] Add all QL2-5 and KL2-5 entries
- [ ] Calculate appropriate level values

**If board ID resolution (Root Cause D):**
- [ ] Fix `resolveBoardId()` logic
- [ ] Ensure consistency

**Time:** 30-60 minutes depending on complexity

### Step 4: Add Tests
- [ ] Create unit tests for the specific fix
- [ ] Add integration test for bishop attacking attack board
- [ ] Run full test suite

**Time:** 45 minutes

### Step 5: Manual Verification
- [ ] Test in browser
- [ ] Verify fix doesn't break existing functionality
- [ ] Test edge cases

**Time:** 20 minutes

### Step 6: Remove Debug Logging
- [ ] Remove temporary console.log statements
- [ ] Keep only essential logging
- [ ] Commit clean code

**Time:** 10 minutes

---

## Total Estimated Time: 3-4 hours

## Success Criteria

1. ✅ Bishop at d5N shows a8QL6 in legal moves list
2. ✅ Bishop can execute the capture move
3. ✅ All existing tests still pass
4. ✅ New tests added for cross-board attacks
5. ✅ Code is clean (debug logging removed)
6. ✅ Documentation updated

---

## Rollback Plan

If fix causes regressions:

1. Revert the problematic commit
2. Re-analyze with more targeted logging
3. Consider a more conservative fix
4. Add more tests before implementing again

## Notes

- This is a critical feature for 3D chess gameplay
- The fix should not compromise piece movement rules
- Consider performance implications of path validation changes
- Document any assumptions about 3D diagonal movement
