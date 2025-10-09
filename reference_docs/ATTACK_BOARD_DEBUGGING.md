# Attack Board Movement Debugging Plan - Progress Update

## Session 1 Progress (Completed)

### Issues Fixed ✅

1. **Turn Toggle After Attack Board Moves**
   - **Problem**: Turn was not transferring after attack board moves (line 49, 67 of original plan)
   - **Fix**: Added turn toggle logic to both `moveAttackBoard` and `rotateAttackBoard` in `gameStore.ts`
   - **Implementation**: 
     ```typescript
     const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';
     set({ ...updatedState, currentTurn: nextTurn });
     get().updateGameState();
     ```
   - **Result**: Turn now correctly switches from White to Black (and vice versa) after attack board movements

2. **Z-Axis Positioning Fix**
   - **Problem**: Z-axis was using level-bucket logic instead of pin.zHeight (lines 59-74 of original plan)
   - **Fix**: Updated `updateAttackBoardWorld` to use `pin.zHeight` directly
   - **Implementation**: Replaced level-bucket calculation with `const attackBoardZ = pin.zHeight;`
   - **Result**: Attack boards now position at exact heights specified in `PIN_POSITIONS`

3. **Attack Board Visual Position Updates**
   - **Problem**: Boards were not visually moving to new positions after moves
   - **Root Cause**: `updateAttackBoardWorld` only updated Z position, not X/Y positions or board metadata
   - **Fix**: Complete rewrite of `updateAttackBoardWorld` to:
     - Recompute files and ranks based on new pin position
     - Calculate new centerX and centerY based on rank/file positions
     - Update all square worldX, worldY, and worldZ coordinates
   - **Result**: Boards now properly update their position data when moving to new pins

4. **Pieces Staying Visible During Board Moves**
   - **Problem**: Pieces (especially pawns) were disappearing when boards moved
   - **Root Cause**: Square coordinates weren't being updated, causing pieces to render at stale positions
   - **Fix**: Included in the `updateAttackBoardWorld` fix - all squares now update their world positions
   - **Result**: Pieces stay visible and move with their boards

5. **King and Pawn Saved Game**
   - **Added**: New "King and Pawn" saved game state in `localStoragePersistence.ts`
   - **Contents**: 
     - White king on WKL at KL1
     - Black king on BKL at KL6
     - White pawn on WQL at z1 (file 0, rank 1)
     - Black pawn on BQL at z8 (file 0, rank 8)
   - **Purpose**: Provides a minimal test scenario for attack board movements with passengers

### Debug Instrumentation Added 🔍

Added comprehensive console logging in three key locations:

1. **`gameStore.ts - moveAttackBoard`**:
   - Logs before: boardId, fromPinId, toPinId, rotate, currentTurn
   - Logs king piece positions before/after move
   - Logs after: nextTurn, moveHistoryLength

2. **`worldMutation.ts - executeBoardMove`**:
   - Logs passenger count
   - Logs passenger piece IDs and positions
   - Logs remapping details for each passenger (from → to coordinates)

3. **`gameStore.ts - updateAttackBoardWorld`**:
   - Logs boardId, pinId, pin level, pin zHeight
   - Logs computed files, ranks, centerX, centerY, centerZ
   - Logs rotation

### Testing Completed ✅

**Manual Testing with "King and Pawn" Game**:
- ✅ Turn indicator correctly changes after board moves (White → Black)
- ✅ Move history records board movements (e.g., "WQL: QL1-QL2")
- ✅ King remains visible after board movements
- ✅ Pawn remains visible after board movements
- ✅ Board maintains proper Z-displacement from main board
- ✅ All adjacency rules and tooltips working correctly
- ✅ Backward-only moves correctly blocked when board is occupied

**Lint Status**: ✅ Passed with 2 pre-existing warnings in unmodified files

### Files Modified

1. `src/store/gameStore.ts`:
   - Added turn toggle to `moveAttackBoard` and `rotateAttackBoard`
   - Rewrote `updateAttackBoardWorld` to properly update all board position data
   - Added debug logging

2. `src/engine/world/worldMutation.ts`:
   - Added debug logging to `executeBoardMove`

3. `src/persistence/localStoragePersistence.ts`:
   - Added "King and Pawn" saved game state
   - Fixed pawn positions to be on attack boards (WQL/BQL) instead of main boards

## Session 2 Progress (Completed) ✅

### Issue Fixed: Player-Relative Direction Logic

**Problem**: The `requiresEmpty` constraint in attack board adjacency rules was applied uniformly without considering player ownership. The direction "backward" was treated as absolute (based on rank numbers) rather than relative to the player.

**Solution Implemented**:
1. Added `getBoardColor(boardId)` helper function to extract player color from board ID
2. Added `getRelativeDirection(absoluteDirection, boardColor)` to flip forward/backward for Black boards
3. Updated `validateAdjacency()` to compute player-relative directions before checking `requiresEmpty`

**Code Changes** (`src/engine/world/worldMutation.ts`):
- New helper functions determine board ownership and transform directions
- For Black boards, "forward" and "backward" are flipped since Black plays from the opposite side
- "side" moves remain unchanged for both colors

**Testing Results** ✅:
- White's WQL can move QL1→QL2 while occupied (forward for White) ✅
- Black's BQL can now move QL6→QL5 while occupied (forward for Black) ✅
- Turn toggles correctly after both moves ✅
- Move history records movements properly ✅
- Lint passed with only pre-existing warnings ✅

**PR**: #27 - All CI checks passed

---

---

## Session 3 Progress (Completed) ✅

### Issue Fixed: Pin Rank Offset Configuration & Vertical Shadow Validation

**Problem**: Pin positions had incorrect rankOffset values that didn't match the game's spatial design. Additionally, the vertical shadow validation was incorrectly using board centerZ instead of pin zHeight.

**Root Cause Analysis**:
1. Pin rankOffset values were using a simple incrementing pattern (0,2,4,6,8) that didn't match the actual board attachment points
2. The pinRankMap in ATTACK_BOARD_RULES.md specified the correct rank mappings that differed from the code
3. Vertical shadow validation was comparing board centerZ values instead of pin zHeight values

**Solution Implemented**:

1. **Updated Pin Positions** (`src/engine/world/pinPositions.ts`):
   - QL1/KL1: rankOffset=0 (ranks 0-1) ✅ - Front overhang in front of White main board
   - QL2/KL2: rankOffset=4 → ranks 4-5 (was 2) - Rear pin of White main board
   - QL3/KL3: rankOffset=2 → ranks 2-3 (was 4) - Lower neutral bridge, faces backward
   - QL4/KL4: rankOffset=6 (ranks 6-7) ✅ - Upper neutral bridge
   - QL5/KL5: rankOffset=4 → ranks 4-5 (was 8) - Front pin of Black main board, overhangs backward
   - QL6/KL6: rankOffset=8 (ranks 8-9) ✅ - Rearmost attack boards

2. **Fixed Vertical Shadow Validation** (`src/engine/world/worldMutation.ts`):
   - Changed from comparing `board.centerZ` to comparing actual Z-heights
   - For main board pieces: Use level-based Z-height (W=0, N=5, B=10)
   - For attack board pieces: Look up the pin's zHeight from attackBoardPositions
   - Only block if piece and destination are at DIFFERENT Z-heights with same file/rank

**Code Changes**:
```typescript
// Now correctly compares Z-heights instead of board centers
let pieceZHeight: number;
if (pieceLevel === 'W' || pieceLevel === 'N' || pieceLevel === 'B') {
  pieceZHeight = mainLevelZ[pieceLevel];
} else {
  const piecePinId = context.attackBoardPositions[pieceLevel];
  const piecePin = PIN_POSITIONS[piecePinId];
  pieceZHeight = piecePin.zHeight;
}
return pieceZHeight !== destinationZHeight;
```

**Testing Results** ✅:
- Pin positions now match the documented pinRankMap from ATTACK_BOARD_RULES.md
- Vertical shadow correctly prevents overlapping boards at different Z-heights
- Vertical shadow correctly ALLOWS boards at the same Z-height even with shared file/rank
- "King and Pawn" game shows proper blocking when pieces create vertical shadows
- Attack boards properly validate movement based on actual 3D spatial positions

**Files Modified**:
1. `src/engine/world/pinPositions.ts` - Updated rankOffset values for pins
2. `src/engine/world/worldMutation.ts` - Fixed vertical shadow Z-height comparison logic
3. `reference_docs/ATTACK_BOARD_DEBUGGING.md` - This document

---

## All Issues Resolved ✅

All attack board movement issues have been successfully debugged and fixed:
1. ✅ Turn toggle after attack board moves
2. ✅ Z-axis positioning
3. ✅ Visual position updates
4. ✅ Pieces staying visible during moves
5. ✅ Player-relative direction logic
6. ✅ Pin rank offset configuration
7. ✅ Vertical shadow validation

The attack board movement system is now fully functional for both White and Black players with correct spatial positioning and vertical shadow rules.

---

## Previous Session Notes - Player-Relative Direction Logic ⚠️

### Problem Identified

**Current Behavior**: The `requiresEmpty` constraint in attack board adjacency rules is applied uniformly without considering player ownership. The direction "backward" is currently treated as absolute (based on rank numbers increasing/decreasing) rather than relative to the player.

**Expected Behavior**: 
- For **White** (playing from bottom): 
  - Forward = increasing ranks (0→9)
  - Backward = decreasing ranks (9→0)
- For **Black** (playing from top):
  - Forward = decreasing ranks (9→0)  
  - Backward = increasing ranks (0→9)

### Manifestation in Testing

When testing the "King and Pawn" game:
- White's WQL at QL1 can move forward to QL2 ✅ (correct)
- Black's BQL at QL6 cannot move to QL5 ❌ (incorrectly blocked as "backward" move)
  - For Black, moving from QL6 (rank 8) to QL5 (rank 8, but different level) should be considered "forward" or "sideways"
  - Currently blocked because the adjacency data marks it as "backward" and requires empty

### Root Cause

The adjacency data in `ATTACK_BOARD_ADJACENCY.ts` and/or `ATTACK_BOARD_RULES.md` defines direction ("forward", "backward", "side") without player context. The validation logic in `validateAdjacency` (worldMutation.ts) checks `edge.requiresEmpty` but doesn't consider which player owns the board being moved.

### Plan for Next Session

#### A) Investigate Current Adjacency Implementation

1. **Read and analyze**:
   - `src/engine/world/attackBoardAdjacency.ts` - Current adjacency data structure
   - `reference_docs/ATTACK_BOARD_RULES.md` - Documented adjacency rules
   - `src/engine/world/worldMutation.ts` - `validateAdjacency` function

2. **Determine**:
   - How directions are currently defined (absolute vs relative)
   - Whether adjacency data differentiates between WQL/WKL (White) and BQL/BKL (Black)
   - If the rules doc specifies player-relative directions

#### B) Design Player-Relative Direction Logic

**Option 1: Separate Adjacency Maps by Color**
- Create separate adjacency definitions for White boards vs Black boards
- White boards: QL1→QL2 is forward, QL2→QL1 is backward
- Black boards: QL6→QL5 is forward, QL5→QL6 is backward
- Pros: Clear, explicit, matches game rules
- Cons: Duplicates adjacency data

**Option 2: Direction Computation at Validation Time**
- Keep single adjacency map with absolute directions
- In `validateAdjacency`, compute effective direction based on:
  - Edge direction from adjacency data
  - Board owner (White or Black)
  - Transform: if boardOwner === 'black', flip "forward" ↔ "backward"
- Pros: Minimal data duplication
- Cons: More complex logic, potential for bugs

**Option 3: Hybrid Approach**
- Adjacency data specifies direction relative to rank increase
- Add player color to board ID (already implicit: W prefix = White, B prefix = Black)
- In validation: determine if rank is increasing/decreasing, compare to player's forward direction
- Pros: Balanced complexity
- Cons: Requires careful testing

#### C) Implementation Steps

1. **Extract board color from boardId**:
   ```typescript
   function getBoardColor(boardId: string): 'white' | 'black' {
     return boardId.startsWith('W') ? 'white' : 'black';
   }
   ```

2. **Compute player-relative direction**:
   ```typescript
   function getRelativeDirection(
     fromPinId: string,
     toPinId: string,
     boardColor: 'white' | 'black',
     absoluteDirection: string[]
   ): string[] {
     if (boardColor === 'black') {
       // Flip forward/backward for black
       return absoluteDirection.map(dir => {
         if (dir === 'forward') return 'backward';
         if (dir === 'backward') return 'forward';
         return dir; // 'side' stays the same
       });
     }
     return absoluteDirection;
   }
   ```

3. **Update validateAdjacency**:
   ```typescript
   function validateAdjacency(context: BoardMoveContext): BoardMoveValidation {
     const adjacencyList = ATTACK_BOARD_ADJACENCY[context.fromPinId];
     if (!adjacencyList) {
       return { isValid: false, reason: 'Invalid source pin' };
     }
   
     const edge = adjacencyList.find(e => e.to === context.toPinId);
     if (!edge) {
       return { isValid: false, reason: 'Destination pin is not adjacent' };
     }
   
     // NEW: Compute player-relative direction
     const boardColor = getBoardColor(context.boardId);
     const relativeDir = getRelativeDirection(
       context.fromPinId,
       context.toPinId,
       boardColor,
       edge.dir
     );
   
     // Check if this is a backward move for this player
     const isBackwardForPlayer = relativeDir.includes('backward');
   
     if (edge.requiresEmpty && isBackwardForPlayer) {
       const passengerPieces = getPassengerPieces(
         context.boardId,
         context.fromPinId,
         context.pieces
       );
       if (passengerPieces.length > 0) {
         return {
           isValid: false,
           reason: 'Cannot move backward while occupied'
         };
       }
     }
   
     return { isValid: true };
   }
   ```

#### D) Testing Plan

1. **Unit Tests**:
   - Test White board moving forward (empty and occupied)
   - Test White board moving backward (must be empty)
   - Test Black board moving forward (empty and occupied)
   - Test Black board moving backward (must be empty)

2. **Manual Testing**:
   - Load "King and Pawn" game
   - Verify White can move WQL forward freely
   - Verify Black can move BQL forward freely (this should now work!)
   - Verify backward moves are blocked when occupied for both colors

3. **Edge Cases**:
   - Sideways moves (should not be affected by requiresEmpty based on direction)
   - Diagonal moves (combination of forward/backward + side)
   - Verify the direction flip doesn't affect rotation logic

#### E) Validation

- Update `src/engine/world/__tests__/attackBoardAdjacencyFromDocs.test.ts` to test both White and Black boards
- Ensure all existing tests still pass
- Add new tests specifically for player-relative direction logic

### Expected Outcome

After implementing player-relative direction logic:
- Black's BQL at QL6 should be able to move to QL5 when occupied (forward move for Black)
- Black's BQL at QL6 should NOT be able to move back to higher pins when occupied (backward for Black)
- White's behavior should remain unchanged (already correct)
- All adjacency rules should work correctly for both players

### Deliverables for Next Session

- [ ] Updated `validateAdjacency` function with player-relative direction logic
- [ ] Helper functions: `getBoardColor()` and `getRelativeDirection()`
- [ ] Updated tests to cover both White and Black board movements
- [ ] Manual verification with "King and Pawn" game showing Black can now move
- [ ] Documentation of the direction calculation logic
- [ ] PR with all changes, including this progress update

---

## Original Problem Summary (For Reference)

From the initial debugging plan:

- Documented JSON in ATTACK_BOARD_RULES.md defines allowed edges per pin with dir and requiresEmpty
- Engine validateBoardMove applies multiple layers: adjacency, occupancy/passenger count, vertical shadow, rotation rules, and king-safety
- Direction logic ("backward", "forward", "side") must be interpreted relative to the player, not as absolute board positions

## Files to Review/Modify in Next Session

1. `src/engine/world/worldMutation.ts` - Update `validateAdjacency` function
2. `src/engine/world/attackBoardAdjacency.ts` - Review adjacency data structure
3. `reference_docs/ATTACK_BOARD_RULES.md` - Verify direction definitions
4. `src/engine/world/__tests__/attackBoardAdjacencyFromDocs.test.ts` - Add player-relative tests

## Notes for Next Devin

- All core infrastructure is working (turn toggle, Z-positioning, visual updates, piece visibility)
- The only remaining issue is making direction logic player-relative
- Debug logging is in place - you can monitor board moves in browser console
- "King and Pawn" saved game is perfect for testing this issue
- PR #25 contains all the fixes so far: https://github.com/wpettine/open_tri_dim_chess/pull/25
