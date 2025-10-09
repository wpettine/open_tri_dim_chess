# Attack Board Movement - Debugging Reference

This document provides a reference for debugging attack board movement functionality, including a history of fixes and a guide to relevant files.

## History of Fixes

### Session 1: Core Movement Infrastructure
**Issues Fixed:**
1. **Turn Toggle After Attack Board Moves** - Added turn switching logic to `moveAttackBoard` and `rotateAttackBoard` in gameStore.ts
2. **Z-Axis Positioning** - Updated `updateAttackBoardWorld` to use `pin.zHeight` directly instead of level-bucket calculations
3. **Visual Position Updates** - Rewrote `updateAttackBoardWorld` to recompute all board positions (centerX, centerY, centerZ) and update square worldX/Y/Z coordinates
4. **Pieces Visibility During Board Moves** - Fixed by ensuring square coordinates update when boards move, keeping pieces rendered at correct positions
5. **Test Game Added** - Created "King and Pawn" saved game in localStoragePersistence.ts for testing attack board movements with passengers

### Session 2: Player-Relative Direction Logic
**Issues Fixed:**
1. **Direction Interpretation** - Implemented player-relative direction logic so "forward" and "backward" are relative to the controlling player, not absolute board positions
2. **Helper Functions Added:**
   - `getBoardColor()` - Extracts owner color from board ID
   - `getBoardController()` - Determines controller based on passenger pieces
   - `classifyDirection()` - Computes direction relative to controller (moved to attackBoardAdjacency.ts)
3. **Adjacency Validation** - Updated `validateAdjacency()` in worldMutation.ts to use player-relative directions before checking occupancy constraints

### Session 3: Pin Rank Offset Configuration
**Issues Fixed:**
1. **Incorrect Pin Rank Offsets** - Updated pinPositions.ts rankOffset values to match the pinRankMap specification in ATTACK_BOARD_RULES.md:
   - QL2/KL2: 2 → 4 (ranks 4-5)
   - QL3/KL3: 4 → 2 (ranks 2-3)
   - QL5/KL5: 8 → 4 (ranks 4-5)
2. **Vertical Shadow Z-Height Comparison** - Fixed validateVerticalShadow() to compare actual Z-heights instead of board centerZ values, properly handling both main board pieces and attack board pieces

### Session 4: Attack Board Rendering After Movement (INCOMPLETE)
**Issue Identified:**
Attack boards render with squares scattered around the platform rather than cohesively positioned on the platform. The squares follow a consistent pattern relative to the platform, suggesting a coordinate transformation error rather than random positioning.

**What Was Tried:**
1. **Added hydrateFromPersisted world updates** - Added updateAttackBoardWorld() calls in hydrateFromPersisted() to sync world coordinates when loading saved games (matching the restoreSnapshot() pattern)
2. **Updated square file/rank values** - Modified updateAttackBoardWorld() to update each square's file and rank properties to match the new pin position before calculating worldX/Y/Z coordinates
3. **Attempted to move squares into rotated group** - Initially tried moving squares inside the rotated board group in BoardRenderer.tsx and calculating relative positions, but this caused the page to fail to render

**Root Cause Hypothesis:**
The squares are rendering at **absolute world coordinates** while the platform is positioned **relative to the board center**. In BoardRenderer.tsx:
- Platform is inside a `<group>` at position `[board.centerX, board.centerY, board.centerZ]` with rotation applied
- Squares are rendered OUTSIDE this group at position `[square.worldX, square.worldY, square.worldZ]`
- When the board rotates, the platform rotates but the squares don't because they're positioned absolutely

The coordinate transformation issue is likely that:
- `updateAttackBoardWorld()` is calculating square positions based on file/rank to worldX/Y conversion
- But these calculations may not account for the fact that squares need to be positioned **relative to the board center** when the board has a rotation applied
- OR the squares need to be inside the rotated group (but positioned relative to center)

**Next Steps to Investigate:**
1. **Compare initial vs moved board coordinates** - Log and compare the worldX/Y/Z values for squares on an attack board at initial position vs after movement to understand the transformation
2. **Examine BoardRenderer rendering approach** - Understand why platform is in a rotated group while squares are not
3. **Check createAttackBoard initial setup** - See how worldX/Y/Z are calculated initially in worldBuilder.ts and ensure updateAttackBoardWorld uses the same logic
4. **Consider two possible fixes:**
   - Option A: Keep squares outside rotated group but ensure worldX/Y/Z accounts for rotation
   - Option B: Move squares inside rotated group and calculate positions relative to board center (tried but failed - needs investigation why)
5. **Add debug visualizer** - Use WorldGridVisualizer or add console logging to see actual vs expected square positions

## Key Files Reference

### Core Logic Files

**`src/engine/world/pinPositions.ts`**
- Defines PIN_POSITIONS with rankOffset, fileOffset, zHeight, adjacentPins, level, and inverted properties for all 12 pins (QL1-QL6, KL1-KL6)
- Contains getInitialPinPositions() for starting attack board positions
- Critical constants: Z_WHITE_MAIN=0, Z_NEUTRAL_MAIN=5, Z_BLACK_MAIN=10, ATTACK_OFFSET=2.5

**`src/engine/world/worldMutation.ts`**
- Contains validateBoardMove() - master validation function that orchestrates all checks
- Validation functions: validateRotation(), validateAdjacency(), validateOccupancy(), validateVerticalShadow(), validateKingSafety()
- Contains executeBoardMove() - updates piece positions and attack board positions when a board moves
- Helper functions: getBoardOwner(), getBoardController(), getPassengerPieces(), getBoardSquaresForBoardAtPin()

**`src/engine/world/attackBoardAdjacency.ts`**
- Defines ATTACK_BOARD_ADJACENCY map - specifies which pins are adjacent to each other
- Contains classifyDirection() - determines if a move is "forward", "backward", or "side" relative to the controlling player
- Helper functions: getPinLevel(), getPinColumn()

**`src/engine/world/worldBuilder.ts`**
- Contains createChessWorld() - initializes the World Grid System by creating all boards and squares
- Functions: createMainBoard(), createAttackBoard() - generate board layouts and pre-compute square positions

**`src/engine/world/coordinates.ts`**
- Contains fileToWorldX() and rankToWorldY() - THE single source of truth for coordinate transformations
- Contains createSquareId() - generates unique square identifiers like "z0WQL"

**`src/engine/world/types.ts`**
- Type definitions: ChessWorld, WorldSquare, BoardLayout, PinPosition

### State Management

**`src/store/gameStore.ts`**
- Contains GameState interface and useGameStore Zustand hook
- Attack board actions: moveAttackBoard(), rotateAttackBoard(), selectBoard(), canMoveBoard(), canRotate()
- Contains updateAttackBoardWorld() - updates ChessWorld when attack boards move (recomputes all square positions)
- Helper functions: buildPersistablePayload(), hydrateFromPersisted()

### UI Components

**`src/components/UI/AttackBoardControls.tsx`**
- UI panel for selecting and moving attack boards
- Displays board selection buttons (WQL, WKL, BQL, BKL)
- Shows eligible destination pins with visual highlighting
- Rotation controls (0° and 180°)

**`src/components/Board3D/BoardRenderer.tsx`**
- Renders all 7 boards (3 main + 4 attack) using Three.js
- SingleBoard component renders platforms, squares, and pin location disks
- Highlights eligible pins when an attack board is selected
- Handles click events for square and board selection

**`src/components/Board3D/Pieces3D.tsx`**
- Renders all chess pieces in 3D
- Reads piece positions from WorldSquare data (never calculates positions)

### Testing and Debugging

**`src/persistence/localStoragePersistence.ts`**
- Contains saved game definitions for testing:
  - **"Kings Only"** - White king on WKL at KL1, Black king on BKL at KL6 (minimal setup)
  - **"King and Pawn"** - Adds White pawn on WQL and Black pawn on BQL (tests passenger mechanics)

**`src/engine/world/__tests__/coordinateValidation.test.ts`**
- Tests rank continuity (same rank = same worldY across all boards)
- Tests file consistency (same file = same worldX across all boards)
- Tests attack board coordinate alignment
- Tests consistent coordinate functions

**`src/components/Debug/WorldGridVisualizer.tsx`**
- Visual debugging tool for verifying coordinate system
- Renders wireframe boxes and labels for all squares

### Documentation

**`reference_docs/ATTACK_BOARD_RULES.md`**
- Comprehensive specification of attack board movement rules
- Contains pinRankMap with exact rank ranges for each pin
- Defines adjacency graph, direction model, and movement constraints
- Includes JSON specifications for engine implementation
- Documents vertical shadow rule, rotation rules, and occupancy constraints

**`reference_docs/IMPLEMENTATION_GUIDE.md`**
- Phase-by-phase implementation plan
- Emphasizes validation-first approach (Phase 3 checkpoint)

**`reference_docs/move_logic_tests.md`**
- Formal specification of all move rules
- Defines vertical shadow rule and pure vertical movement prohibition

## Testing Methodology

**Manual Testing:**
1. Load "King and Pawn" saved game from Save/Load menu
2. Select an attack board (WQL/WKL for White, BQL/BKL for Black)
3. Verify eligible pins highlight correctly
4. Move board to different pins and verify:
   - Visual position updates correctly
   - Pieces move with the board (passengers)
   - Turn switches after the move
   - Move history records the board movement
5. Test rotation (180°) with and without passengers
6. Test backward moves (should be blocked when occupied)

**Automated Testing:**
- Run `npm test -- coordinateValidation.test.ts` to verify coordinate system integrity
- All 4 coordinate validation tests must pass

## Debug Logging

Debug logging is active in:
- `gameStore.ts - moveAttackBoard()` - Logs turn changes and piece positions
- `worldMutation.ts - executeBoardMove()` - Logs passenger remapping details
- `gameStore.ts - updateAttackBoardWorld()` - Logs board position calculations

Check browser console during board movements to see detailed coordinate transformations.

## Critical Design Principles

1. **World Grid System** - All positions pre-computed at initialization in createChessWorld(). Components only read from WorldSquare, never calculate positions.

2. **Player-Relative Directions** - "Forward" means toward opponent's home level (White→6, Black→1). "Backward" means toward own home level.

3. **Pin Rank Mapping** - Each pin has a specific rankOffset that determines which two ranks it occupies. See pinRankMap in ATTACK_BOARD_RULES.md.

4. **Vertical Shadow Rule** - Attack boards cannot move to positions where any of their 4 squares would be vertically aligned (same file+rank, different Z) with a non-knight piece.

5. **ChessWorld Immutability** - Only updateAttackBoardWorld() and executeBoardMove() mutate the ChessWorld. This prevents coordinate corruption.
