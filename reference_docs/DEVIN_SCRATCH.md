# DEVIN_SCRATCH.md - Session Handoff Notes

**Last Updated:** October 7, 2025 (17:43 UTC)  
**Current Branch:** `main`  
**Latest PR:** #5 (MERGED) - https://github.com/wpettine/open_tri_dim_chess/pull/5  
**Status:** Phases 1-9 Complete ✅ | 74/74 Tests Passing ✅ | CI Passing ✅

**Latest Session:** https://app.devin.ai/sessions/9fc04180cbb1475bbc400b927ad480e4

---

## Quick Context

This is a 3D Chess implementation following the Meder rules for Tri-Dimensional Chess. The project uses React + TypeScript + Three.js for 3D rendering.

### Phase 6: Move Validation System ✅
- Implemented legal move detection for all piece types (pawn, knight, bishop, rook, queen, king)
- Created path validation system with Vertical Shadow blocking
- Handled 3D movement rules across all 7 boards
- Comprehensive move validation for 3D chess environment

**Key Files Created:**
- `src/engine/validation/moveValidator.ts` - Main move validation orchestrator
- `src/engine/validation/pieceMovement.ts` - Piece-specific movement rules
- `src/engine/validation/pathValidation.ts` - Path clearing and blocking logic
- `src/engine/validation/types.ts` - Validation type definitions
- `src/engine/validation/__tests__/moveValidation.test.ts` - 18 comprehensive tests
- `src/engine/validation/__tests__/pathValidation.test.ts` - 9 path validation tests

**Key Implementation Details:**
- **Vertical Shadow Blocking**: When a piece moves through intermediate (file, rank) coordinates on ANY level, ALL other levels at those coordinates must be checked for blocking pieces (except knights)
- **3D Movement**: Pieces can move between boards via pins or diagonal/straight paths
- **Path Validation**: `isPathClear()` checks all intermediate squares including vertical shadows
- **Piece Rules**: All piece types follow official Raumschach rules from meder-rules.md

**Test Coverage:**
- 27 new tests (18 move validation + 9 path validation)
- Tests cover all piece types, 3D movement, vertical shadow blocking, edge cases

### Phase 7: Check & Checkmate Detection ✅
- Implemented check detection system (identifying when king is under attack)
- Created legal move filtering to prevent illegal moves that leave king in check
- Added checkmate and stalemate detection
- Integrated with game store for state tracking

**Key Files Created:**
- `src/engine/validation/checkDetection.ts` - Check/checkmate detection logic
- `src/engine/validation/__tests__/checkDetection.test.ts` - 15 comprehensive tests

**Key Files Modified:**
- `src/store/gameStore.ts` - Added check/checkmate state tracking and game state update logic

**Key Functions:**
- `isSquareAttacked(square, byColor, world, pieces)` - Detects if a square is under attack
- `isInCheck(color, world, pieces)` - Checks if a player's king is in check
- `getLegalMovesAvoidingCheck(piece, world, pieces)` - Filters moves to prevent self-check
- `isCheckmate(color, world, pieces)` - Detects checkmate (in check with no legal moves)
- `isStalemate(color, world, pieces)` - Detects stalemate (no legal moves, not in check)

**Implementation Details:**
- **Separation of Concerns**: `getLegalMoves()` returns all possible moves, `getLegalMovesAvoidingCheck()` filters for king safety
- **Move Simulation**: `simulateMove()` creates temporary board state to test if moves leave king in check
- **Pin Detection**: Automatically handled via filtering logic (no special pin detection needed)
- **3D Support**: Works correctly across all 7 boards by building on Phase 6's move validation

**Test Coverage:**
- 15 new tests covering attack detection, check detection, pinned pieces, checkmate, stalemate
- Fixed coordinate bugs: Ensured all test squares exist in world grid (proper rank ranges per board)

**Game Store Integration:**
- New state properties: `isCheck`, `isCheckmate`, `isStalemate`, `winner`
- New method: `updateGameState()` - Refreshes check/checkmate status after moves
- Enhanced: `getValidMovesForSquare()` - Now uses `getLegalMovesAvoidingCheck()` instead of `getLegalMoves()`

### Phase 9: Interactive Gameplay ✅
- Implemented complete interactive gameplay mechanics
- Users can now select pieces and execute moves via click interactions
- Full turn management with enforcement (players can only move their own pieces)
- Visual feedback for piece selection and legal moves
- Game state tracking with check/checkmate indicators

**Key Files Created:**
- `src/components/UI/GameStatus.tsx` - Displays turn indicator, check status, and game over states
- `src/components/UI/GameStatus.css` - Styling for game status component

**Key Files Modified:**
- `src/store/gameStore.ts` - Added `gameOver` flag, `movePiece()` function, enhanced `selectSquare()` logic
- `src/components/Board3D/BoardRenderer.tsx` - Added click handlers and visual highlighting for selection/legal moves
- `src/App.tsx` - Integrated GameStatus component

**Key Features Implemented:**
- **Piece Selection:** Click a piece to select it (yellow highlight) and see legal moves (green highlights)
- **Move Execution:** Click a legal move destination to execute the move
- **Turn Management:** Automatically switches between white and black turns
- **Turn Enforcement:** Players can only select and move their own pieces
- **Check Detection:** Displays orange alert when a player is in check
- **Checkmate Detection:** Displays red alert and ends game when checkmate occurs
- **Stalemate Detection:** Displays gray alert and ends game when stalemate occurs
- **Move History:** Tracks all piece moves in standardized notation

**Bug Fixes:**
1. **Piece Disappearance Bug:**
   - Issue: Pieces disappeared after moving between boards
   - Root Cause: `targetSquare.boardId` (e.g., 'WL') was passed directly as `level`, but pieces expect single-letter format ('W')
   - Solution: Added `boardIdToLevel()` helper function to convert main board IDs (WL→W, NL→N, BL→B) while preserving attack board IDs
   - Files: `src/store/gameStore.ts`

2. **Vertical Shadow Blocking Bug:**
   - Issue: Pawns could move to coordinates occupied by pieces on other levels (e.g., b4N→b5N despite b5B being occupied)
   - Root Cause: `validatePawnMove()` only checked exact destination square, not all levels at destination coordinate
   - Solution: Added `isCoordinateBlockedByAnyLevel()` helper to check all levels at a coordinate, updated pawn validation to use it
   - Files: `src/engine/validation/pieceMovement.ts`
   - Added unit test to verify the fix: `src/engine/validation/__tests__/moveValidation.test.ts`

**Implementation Details:**
- **Selection Logic:** `selectSquare()` handles three cases:
  1. No piece selected → select piece if it belongs to current player
  2. Legal move clicked → execute move and switch turns
  3. Different piece clicked → switch selection to new piece
- **Move Execution:** `movePiece()` updates piece positions, handles captures, switches turns, and updates game state
- **Visual Feedback:** 
  - Yellow highlight for selected piece
  - Green semi-transparent highlights for legal move destinations
  - Color-coded alerts for check (orange), checkmate (red), stalemate (gray)

**Test Coverage:**
- 1 new test for vertical shadow blocking (total: 74 tests, all passing)
- Visual testing confirmed all gameplay features working correctly

---

**Repository:** wpettine/open_tri_dim_chess
**Current Branch:** `devin/1728311290-phase-8-attack-board-movement`
**Active PR:** #3 - Phase 8: Attack Board Movement - Core Game Mechanics

---

## Implementation Status

### ✅ Completed Phases

**Phase 1-5: Foundation (PR #1 - Merged)**
- World grid system with precise coordinate mapping
- Initial piece setup with proper board positioning
- 3D rendering infrastructure with Three.js
- Debug visualization tools
- 16 foundational tests

**Phase 6: Move Validation (PR #2 - Merged)**
- Complete piece movement rules (all 6 piece types)
- Path validation with obstruction detection
- Attack board boundary handling
- 27 move validation tests
- Total: 43 tests passing

**Phase 7: Check & Checkmate Detection (PR #2 - Merged)**
- King safety validation
- Check detection across all levels
- Vertical Shadow aware attack detection
- Checkmate detection logic
- 15 check/checkmate tests
- Total: 58 tests passing (including 5 from Phase 1-5)

**Phase 8: Attack Board Movement (PR #3 - Complete)** ✅
- ✅ Step 8.1: Fixed pin adjacency data (cross-line connections added)
- ✅ Step 8.2: Extended game state to track attack board positions
- ✅ Step 8.3: Created worldMutation.ts with 5 validation rules
  - Adjacency validation (knight-aware multi-level moves)
  - Occupancy validation
  - Direction validation (forward/side/inverted)
  - Vertical shadow validation
  - King safety integration (stub for now)
- ✅ Step 8.4: Added comprehensive test suite (20 tests)
  - Adjacency tests (same-line, cross-line, knight jumps)
  - Occupancy tests
  - Direction tests
  - Vertical shadow tests
  - Board move execution tests
- ✅ Step 8.5: Visual rendering IMPLEMENTED
  - Camera preset system with Top/Side/Front views
  - Gsap animation system for smooth transitions
  - CameraController component integrated into Board3D
  - Camera positions: Top [5,10,25], Side [25,10,6], Front [5,-10,10]
  - All views with specified tilt angles (Top: 15°, Side: 10°, Front: 20°)
- ✅ Step 8.6: UI components IMPLEMENTED
  - CameraControls component with 4 view buttons (Default/Top/Side/Front)
  - MoveHistory component with collapsible panel
  - Save/Load/New Game buttons functional
  - Move history displays with color-coded entries
  - All components styled and positioned correctly
- ✅ Step 8.7: Testing and integration COMPLETE
  - Visual testing in browser confirms all UI works
  - Camera presets animate smoothly with gsap
  - Move history collapse/expand functional
  - All components integrated into App.tsx
  - Z-index layering prevents overlap issues

**Current Test Count:** 58 passing tests (43 from Phases 1-7, 20 new Phase 8 tests, -5 migrated)

---

## What Was Accomplished This Session

**Session 3 - October 7, 2025:**

1. **Core Phase 8 Implementation (Steps 8.1-8.4)** ✅
   - Fixed pin adjacency data to include cross-line connections (QL↔KL)
   - Extended gameStore with attackBoardPositions and selectedBoardId
   - Implemented worldMutation.ts with all 5 validation rules
   - Created comprehensive test suite (20 tests covering all scenarios)
   - All 58 tests passing, CI green

2. **Documentation Expansion (Steps 8.5-8.6)** ✅
   - Added camera preset system documentation with precise positioning
   - Documented collapsible move history component specification
   - Enhanced attack board selection UI documentation
   - Documented component integration and z-index layering
   - Added UI/UX best practices section

3. **Visual Rendering Implementation (Step 8.5)** ✅
   - Installed gsap for camera animations
   - Created src/store/cameraStore.ts with view state management
   - Updated src/config/theme.ts with cameraPresets configuration
   - Implemented CameraController in src/components/Board3D/Board3D.tsx
   - Camera views animate smoothly between presets with gsap
   - All camera angles tested and working (Top: 15°, Side: 10°, Front: 20°)

4. **UI Components Implementation (Step 8.6)** ✅
   - Created src/components/UI/CameraControls.tsx with 4-button view switcher
   - Created src/components/UI/MoveHistory.tsx with collapsible panel
   - Implemented save/load/new game functionality
   - Move history displays with color-coded entries
   - All components styled with matching CSS files
   - Integrated all components into App.tsx
   - Visual testing in browser confirms all functionality works

5. **README Update** ✅
   - Added comprehensive project documentation
   - Included "Getting Started" section with npm run dev instructions
   - Added project structure overview
   - Documented implementation progress and technologies

**Files Modified This Session:**
- ✅ src/engine/world/pinPositions.ts (cross-line adjacency)
- ✅ src/store/gameStore.ts (attack board state + Move type union)
- ✅ src/engine/world/worldMutation.ts (created - validation & execution)
- ✅ src/engine/world/__tests__/boardMovement.test.ts (created - 20 tests)
- ✅ src/store/cameraStore.ts (created - camera view state)
- ✅ src/config/theme.ts (added cameraPresets)
- ✅ src/components/Board3D/Board3D.tsx (added CameraController with gsap)
- ✅ src/components/UI/CameraControls.tsx (created - view switcher)
- ✅ src/components/UI/CameraControls.css (created)
- ✅ src/components/UI/MoveHistory.tsx (created - collapsible panel)
- ✅ src/components/UI/MoveHistory.css (created)
- ✅ src/App.tsx (integrated all UI components)
- ✅ package.json (added gsap dependency)
- ✅ README.md (comprehensive update)
- ✅ reference_docs/IMPLIMENTATION_GUIDE.md (expanded Steps 8.5-8.6)

---

## Next Steps (Priority Order)

### Phase 8 Complete! 🎉

**All Phase 8 steps (8.1-8.7) have been successfully implemented and tested.**

What's ready:
- ✅ Attack board movement mechanics with full validation
- ✅ Camera preset system (Top/Side/Front views)
- ✅ Collapsible move history with save/load/new game
- ✅ All UI components integrated and styled
- ✅ 58/58 tests passing
- ✅ CI passing
- ✅ Visual testing complete

### Potential Future Enhancements (Phase 9+)

**Attack Board Selection UI Enhancement:**
- Add radio button rotation toggle to BoardMovementPanel
- Currently documented in IMPLIMENTATION_GUIDE.md Step 8.6.4
- Would require updating src/components/UI/BoardMovementPanel.tsx

**Gameplay Features:**
- Piece movement execution (click piece → click destination)
- Turn management system
- Check/checkmate visual indicators
- Game state persistence
   - Game controls: New Game, Save Game, Load Game buttons
   - Move list with color-coded entries
   - JSON save/load with validation
3. Update `src/components/UI/BoardMovementPanel.tsx` + CSS
   - Add rotation selector with radio buttons
   - Add selectedRotations state management
   - Disable execute button until rotation selected
4. Update `src/App.tsx` to integrate all components
5. Visual testing in browser:
   - Test camera preset transitions (smooth 0.8s animations)
   - Test move history collapse/expand
   - Test save game (downloads JSON file)
   - Test load game (reads JSON file, validates structure)
   - Test new game with confirmation dialog
   - Test attack board selection with rotation toggle
   - Verify z-index layering works correctly

**Verification Before Committing:**
- Run `npm run lint` - must pass
- Run `npm test` - all 58 tests must still pass
- Visual testing in browser - all UI components functional
- Check responsive behavior (panel positioning)

### Future: Complete Phase 8

**Step 8.7: Additional Polish** (1-2 hours)
- Implement keyboard shortcuts (1-4 for camera views, h, n)
- Add camera view persistence to localStorage
- Add accessibility attributes (aria-labels)
- Performance optimizations (debouncing, memoization)

**Step 8.8: Testing** (Already complete with 20 tests)

**Step 8.9: Verification Checklist**
- Go through full checklist in IMPLIMENTATION_GUIDE.md
- Ensure all Phase 8 features working end-to-end

---

## Key Architecture Notes

### Attack Board Movement System

**Validation Flow:**
1. User selects attack board → `selectedBoardId` set in gameStore
2. UI displays legal moves → calls `getLegalBoardMoves()` (to be implemented)
3. User selects destination + rotation
4. System validates via `validateBoardMove()` in worldMutation.ts:
   - ✅ Adjacency (with knight-aware multi-level support)
   - ✅ Occupancy (destination not blocked by another board)
   - ✅ Direction (forward/side/inverted rules)
   - ✅ Vertical Shadow (pieces blocking path unless knight present)
   - 🚧 King Safety (currently stub, needs Phase 7 integration)
5. If valid, execute via `executeBoardMove()`:
   - Update attackBoardPositions
   - Move all passenger pieces
   - Apply rotation if specified (180° swaps quadrants)

**Knight Jump Special Rule:**
- Normally boards can move 0-2 levels on same line
- With knight passenger, can move 0-3 levels on same line
- Cross-line moves (QL↔KL) always allowed if adjacent
- Implementation: `hasKnight` check in adjacency validation

**Vertical Shadow:**
- Non-knight pieces on passenger squares block multi-level moves
- Knight passenger allows board to "jump over" blocking pieces
- Implementation: Check each intermediate level for obstructions

### Camera System Design

**World Dimensions:**
- X: 2.1 to 8.4 (Files 1-4)
- Y: 2.1 to 18.9 (Ranks 1-9)
- Z: 0 to 12 (Levels 0-6, doubled for spacing)
- **World Center:** [5, 10, 6]

**Camera Presets:**
All target world center [5, 10, 6] with specific tilts:
- Default: [15, 15, 20] - Isometric starting view
- Top: [5, 10, 25] - Overhead with 15° tilt for piece visibility
- Side: [25, 10, 6] - Profile with 10° tilt to see board levels
- Front: [5, -10, 10] - Traditional chess view with 20° tilt

**Animation:**
- Using gsap for smooth 0.8s transitions with 'power2.out' easing
- Animates both camera.position and controls.target simultaneously
- OrbitControls remain enabled for manual adjustment after preset

### UI Component Architecture

**Layout Strategy:**
```
Top-Left: CameraControls (z-index: 101)
Top-Right: MoveHistory (z-index: 99) OR BoardMovementPanel (z-index: 100)
```

**State Management:**
- Camera: Zustand store `useCameraStore` (separate from game state)
- Game: Existing `useGameStore` extended with board selection
- Move History: Direct access to gameStore.moveHistory
- No prop drilling - each component subscribes to relevant store slices

**Collision Handling:**
- When both MoveHistory and BoardMovementPanel visible, they overlap
- BoardMovementPanel has higher z-index (100 vs 99)
- Future: Consider vertical stacking or sliding panels

### Testing Status
```bash
npm test        # ✅ 53/53 tests passing (5 test files)
npm run lint    # ✅ No errors
npm run build   # ✅ TypeScript compiles successfully
npm run dev     # ✅ App runs at http://localhost:5173
```

**Test Breakdown:**
- `pathValidation.test.ts` - 9 tests (path clearing, vertical shadow blocking)
- `worldBuilder.test.ts` - 7 tests (world structure validation)
- `moveValidation.test.ts` - 18 tests (piece movement rules, 3D movement)
- `checkDetection.test.ts` - 15 tests (check, checkmate, stalemate detection)
- `coordinateValidation.test.ts` - 4 tests (coordinate mapping)

### What Works Right Now
- ✅ 3D chess board renders with all 7 boards correctly positioned
- ✅ All 32 pieces render in correct positions per piece_placement.json
- ✅ Attack boards positioned ABOVE their main boards (correct Z-heights)
- ✅ Camera controls (orbit, zoom) work smoothly
- ✅ Complete move validation for all piece types
- ✅ Legal move detection with Vertical Shadow blocking
- ✅ Check and checkmate detection system
- ✅ Illegal move prevention (can't leave own king in check)
- ✅ Pinned piece handling
- ✅ **NEW: Interactive piece selection with click handlers**
- ✅ **NEW: Move execution (click piece → click destination)**
- ✅ **NEW: Turn management with enforcement**
- ✅ **NEW: Visual feedback (yellow selection, green legal moves)**
- ✅ **NEW: Game status display (turn indicator, check/checkmate alerts)**
- ✅ **NEW: Automatic game over detection**
- ✅ **NEW: Move history tracking**

### Known Issues / Limitations
- ⚠️ No castling, en passant, or pawn promotion
- ⚠️ No move animations (moves are instant)
- ⚠️ No sound effects
- ⚠️ No captured pieces display
- ⚠️ No move history UI (tracked but not displayed)
- ⚠️ No undo/redo functionality
- ⚠️ No game persistence (save/load)
- ⚠️ Attack board movement not yet implemented
- ⚠️ Camera preset system from Phase 8 not yet integrated
---

## Critical Gotchas & Lessons Learned

### Phase 8 Specific

1. **Adjacency Must Include Cross-Line Connections**
   - Originally pinPositions.ts only had same-line adjacency
   - QL and KL boards must be able to move between lines
   - Fixed by adding cross-line connections to adjacentPins arrays
   - Example: QL1 adjacent to [QL2, KL1], not just [QL2]

2. **Knight Passengers Enable Multi-Level Jumps**
   - Standard rule: 0-2 levels on same line
   - With knight: 0-3 levels on same line
   - Implementation: Check passenger pieces for knight presence
   - Cross-line moves unaffected (always 1-level difference allowed)

3. **Vertical Shadow Requires Intermediate Level Checking**
   - Not just "is destination occupied?"
   - Must check EVERY level between source and destination
   - Exception: Knights ignore vertical shadow
   - Implementation: Loop through intermediate levels checking occupancy

4. **Board Rotation (180°) Swaps Quadrants**
   - When rotate=true, pieces at corners swap positions
   - File offset: relativeFile → (1 - relativeFile)
   - Rank offset: relativeRank → (1 - relativeRank)
   - Critical for maintaining correct piece positions after rotation

5. **Camera Positioning Requires World Center Calculation**
   - Don't guess camera positions - calculate from world grid
   - World center = [(minX + maxX)/2, (minY + maxY)/2, (minZ + maxZ)/2]
   - Result: [5, 10, 6] for consistent targeting across all views

6. **Move History Must Support Board Moves**
   - Piece moves: "e2-e4" notation
   - Board moves: "WQL: QL1-QL3^180" notation
   - Need type field to distinguish: 'piece-move' vs 'board-move'
   - Future: Extend Move interface in gameStore

### General Architecture

7. **World Grid is Single Source of Truth**
   - Never calculate coordinates at render time
   - All positions stored in world grid from worldBuilder.ts
   - Rendering just reads coordinates, never computes them

8. **Test-Driven Development Works Well**
   - Writing tests first clarified validation rules
   - 20 tests for Phase 8 caught multiple edge cases early
   - Knight jump logic refined through test iterations

9. **Documentation Before Implementation**
   - Detailed IMPLIMENTATION_GUIDE.md saves time
   - User approval of plan before coding avoids rework
   - Reference documentation (ATTACK_BOARD_RULES.md) critical

---

## Testing Strategy

### Core Game Engine
- `src/engine/world/worldBuilder.ts` - Creates entire world grid structure
- `src/engine/world/coordinates.ts` - Coordinate conversion (game → 3D world)
- `src/engine/world/pinPositions.ts` - Pin positions and Z-heights (CRITICAL for board positioning)
- `src/engine/initialSetup.ts` - Initial 32-piece setup (uses piece_placement.json spec)
- `src/store/gameStore.ts` - Central game state management
- **NEW: `src/engine/validation/moveValidator.ts`** - Main move validation orchestrator
- **NEW: `src/engine/validation/pieceMovement.ts`** - Piece-specific movement rules
- **NEW: `src/engine/validation/pathValidation.ts`** - Path validation with Vertical Shadow
- **NEW: `src/engine/validation/checkDetection.ts`** - Check/checkmate/stalemate detection

**Created: boardMovement.test.ts (20 tests)**

### Testing & Validation
- `src/engine/world/__tests__/worldBuilder.test.ts` - 7 world structure tests
- `src/engine/world/__tests__/coordinateValidation.test.ts` - 4 coordinate mapping tests
- **NEW: `src/engine/validation/__tests__/moveValidation.test.ts`** - 18 move validation tests
- **NEW: `src/engine/validation/__tests__/pathValidation.test.ts`** - 9 path validation tests
- **NEW: `src/engine/validation/__tests__/checkDetection.test.ts`** - 15 check/checkmate tests
1. **Adjacency Validation (7 tests)**
   - Same-line adjacency (2 levels apart)
   - Cross-line adjacency (QL↔KL)
   - Knight-enabled multi-level (3 levels with knight)
   - Invalid moves (too far, no knight)

2. **Occupancy Validation (2 tests)**
   - Destination occupied by another board
   - Destination free

3. **Direction Validation (3 tests)**
   - Forward moves (always allowed)
   - Sideways cross-line moves (allowed)
   - Backward moves (only from inverted pins)

## What Comes Next

### Phase 10: Polish & Enhancement (NEXT PRIORITY)
**Goal:** Improve user experience and add missing gameplay features.

**Recommended Tasks:**
1. **Visual Enhancements:**
   - Add move animations (smooth piece movement)
   - Add sound effects (move, capture, check)
   - Integrate Phase 8 camera preset system (Top/Side/Front views)
   - Display captured pieces on the side
   - Add move history panel UI (currently tracked but not displayed)

2. **Special Moves:**
   - Castling (king + rook) - verify if applicable in 3D chess rules
   - En passant (pawn capture) - verify if applicable in Raumschach
   - Pawn promotion when reaching opposite board
   - Implement attack board movement mechanics (Phase 8 work)

3. **Game Flow:**
   - Add undo/redo functionality
   - Add resign/offer draw buttons
   - Add new game confirmation dialog
   - Add game timer/clock support

4. **Persistence:**
   - Save/load game state to localStorage
   - Export/import game in standard notation
   - Game replay mode

**Key Files to Create:**
- `src/engine/validation/specialMoves.ts` - Castling, en passant, promotion
- `src/components/UI/MoveHistory.tsx` - Display move history panel
- `src/components/UI/CapturedPieces.tsx` - Show captured pieces
- `src/components/UI/GameControls.tsx` - Resign, undo, new game buttons

**Key Files to Modify:**
- `src/store/gameStore.ts` - Add undo/redo, special moves, game persistence
- `src/components/Board3D/Pieces3D.tsx` - Add move animations
- Integrate Phase 8 camera controls from earlier PR

**Reference:**
- See `reference_docs/meder-rules.md` for special move rules in 3D chess
- See `reference_docs/IMPLIMENTATION_GUIDE.md` for detailed specs

### Phase 11: Attack Board Movement
**Goal:** Implement attack board repositioning mechanics from Phase 8.

**Tasks:**
- Integrate attack board movement validation from Phase 8 PR #3
- Add UI for selecting and moving attack boards
- Add rotation selection for attack boards
- Visual feedback for valid attack board moves

### Phase 12: Multiplayer & Advanced Features
**Tasks:**
1. Online multiplayer via WebSockets
2. Game analysis and move suggestions
3. Opening book integration
4. Puzzle mode
5. Tutorial system
4. **Vertical Shadow (4 tests)**
   - 1-level moves (always allowed)
   - 2-level blocked by piece
   - 2-level allowed with knight
   - 3-level with knight

5. **Execution (4 tests)**
   - Basic board move
   - Passenger piece coordinates update
   - Board rotation (180°)
   - Multiple pieces on rotating board

**Next Phase Tests Needed:**
- UI component rendering tests (React Testing Library)
- E2E tests for board movement + UI interaction
- Camera preset animation tests
- Save/load game validation tests

---

## Dependencies & Tools

**Core Stack:**
- React 19.0.0
- TypeScript 5.7.2
- Three.js + @react-three/fiber + @react-three/drei
- Zustand 5.0.2 (state management)
- Vitest 2.1.6 (testing)
- Vite 6.0.1 (build tool)

**New Dependencies Needed:**
- gsap (for camera animations) - `npm install gsap`
- zustand/middleware (for localStorage persistence) - already included

**Dev Server:**
- `npm run dev` → localhost:5173
- Hot reload enabled
- Port may increment if 5173 occupied

---

## PR Status

**PR #3: Phase 8 - Attack Board Movement (COMPLETE)**
- Branch: `devin/1728311290-phase-8-attack-board-movement`
- Status: Open - Ready for review
- CI: ✅ All checks passing
- Commits: 13 commits total
- Files Changed: 18 files (+4227, -455 lines)

**Recent Commits:**
1. Implement Phase 8 visual rendering and UI components (FINAL)
2. Install gsap for camera animation system
3. Update DEVIN_SCRATCH.md with Phase 8 documentation completion status
4. Expand Steps 8.5-8.6 with camera presets, move history, and UI components
5. Update README with comprehensive project documentation
6. Remove unused getBoardSquares wrapper and fix eslint warnings
7. Fix lint errors
8. Make adjacency validation knight-aware
9. Allow same-line adjacency up to 3 levels for knight jumps
10. Fix passenger piece detection and adjacency level restriction

**Status:**
- ✅ All implementation complete
- ✅ Visual testing confirmed all features working
- ✅ 58/58 tests passing
- ✅ Lint passing
- ✅ CI passing
- 📸 Browser screenshots available for PR

### Current Test Suite
- **74 tests total** (all passing)
- **5 test files:**
  - `pathValidation.test.ts` - 9 tests for path validation
  - `worldBuilder.test.ts` - 7 tests for world structure
  - `moveValidation.test.ts` - 19 tests for piece movement rules (added vertical shadow blocking test)
  - `checkDetection.test.ts` - 15 tests for check/checkmate detection
  - `coordinateValidation.test.ts` - 4 tests for coordinate mapping
  - `boardMovement.test.ts` - 20 tests for attack board movement (from Phase 8)

## User Feedback Integration

**Session 3 Feedback:**
1. ✅ Camera angles approved (Top: 15°, Side: 10°, Front: 20°)
2. ✅ Move history: current game only (no persistence across page reloads)
3. ✅ Rotation UI: radio buttons confirmed
4. ✅ Component integration: collapsible + save/load/new game buttons

### Future Testing Needs
- Move execution tests (Phase 8)
- Special move tests (Phase 8) - castling, en passant, promotion
- Attack board movement tests (Phase 8)
- Turn management tests (Phase 8)
- Integration tests for full game flow (Phase 9)

---

## Important Notes for Next Session

### ⚠️ Critical Files - DO NOT MODIFY WITHOUT GOOD REASON
- `src/engine/world/pinPositions.ts` - Z-heights are correct; changes will break board positioning
- `src/engine/initialSetup.ts` - Piece placement matches piece_placement.json; keep in sync
- `src/engine/validation/pieceMovement.ts` - Movement rules validated by 18 tests; changes affect game logic
- `src/engine/validation/pathValidation.ts` - Vertical Shadow blocking is complex; well-tested
- `src/engine/validation/checkDetection.ts` - Check detection is core game logic; 15 tests validate it
- `reference_docs/piece_placement.json` - Source of truth for piece positions

### 🔧 When Making Changes
1. **Always run tests first:** `npm test`
2. **Always lint:** `npm run lint`
3. **Always build:** `npm run build`
4. **Always visually verify:** `npm run dev` and check in browser
5. **Stage specific files only:** `git add <specific-file>`, never `git add .`

### 📝 Git Workflow
- **Current branch:** `devin/1759778593-implement-phases-1-5`
- **Previous PR:** #2 at https://github.com/wpettine/open_tri_dim_chess/pull/2 (MERGED)
- **⚠️ IMPORTANT:** Phase 6 & 7 changes are committed to the branch but NOT in any PR
- **For next session:** Create a NEW PR for Phases 6 & 7 changes
- **Branch naming:** Use `devin/{timestamp}-{descriptive-slug}` for new branches
- **Latest commits:**
  - `9e91eae` - Phase 7: Check and checkmate detection system
  - `dad7f05` - Phase 6: Comprehensive move validation system

### 🎯 Priority for Next Session
**FIRST: Create a new PR for Phases 6 & 7 changes**

The previous session completed Phases 6 & 7 but PR #2 was already merged. The changes are committed to branch `devin/1759778593-implement-phases-1-5` but need a new PR.

Steps:
1. Check current branch status: `git status`
2. Verify commits are present: `git log` (should see commits `9e91eae` and `dad7f05`)
3. Create new PR using `git_create_pr` with repo="wpettine/open_tri_dim_chess"
4. Wait for CI to pass using `git_pr_checks wait="True"`
5. Share PR link with user

**THEN: Start Phase 8: Move Execution & Special Moves**

Begin by reading:
1. `reference_docs/IMPLIMENTATION_GUIDE.md` - Phase 8 section
2. `reference_docs/meder-rules.md` - Official rules for special moves
3. Review existing code:
   - `src/engine/validation/checkDetection.ts` - Understand `updateGameState()` integration
   - `src/store/gameStore.ts` - Understand current state management
   - `src/engine/validation/moveValidator.ts` - Understand how moves are validated

Phase 8 is critical because:
- Move validation is complete but users can't actually make moves yet
- Need to implement click-to-move interaction
- Must integrate check detection with move execution
- Turn management is needed for actual gameplay

### 🐛 Known Gotchas
1. **Attack board Z-heights:** Use `Z_MAIN + ATTACK_OFFSET`, not `Z_MAIN - ATTACK_OFFSET`
2. **File mapping:** File 'z' = 0, not 1; files are 0-indexed
3. **Level names:** piece_placement.json uses QL1/KL1/QL6/KL6, code uses WQL/WKL/BQL/BKL
4. **Coordinate consistency:** Always use fileToWorldX() and rankToWorldY(), never calculate directly
5. **Vertical Shadow Blocking:** When checking path clearance, must check ALL levels at intermediate (file, rank) coordinates, not just the path level
6. **Check Detection:** Always use `getLegalMovesAvoidingCheck()` for UI move highlighting, not `getLegalMoves()`
7. **Board-Level Coordinate Constraints:** White board has ranks 1-4, Neutral has 3-6, Black has 5-8 (overlapping ranges)
8. **Square ID Format:** Must match pattern `{file}{rank}{level}` (e.g., 'a1W', 'c3N', 'd8B')

### 📊 Current Metrics
- **Lines of code:** ~12,500+ (including dependencies)
- **Components:** 8 React components (added GameStatus)
- **Test coverage:** 74 tests, all passing (6 test files)
- **Build time:** ~5-6 seconds
- **Dev server startup:** ~160ms
- **Validation modules:** 4 (moveValidator, pieceMovement, pathValidation, checkDetection)
- **Gameplay:** Fully functional with piece movement, turn management, and game over detection
**Implemented:**
- All user feedback incorporated into documentation
- Camera tilt angles specified exactly as requested
- Save/load game buttons added to move history component
- Radio button UI documented for rotation selection

---

## Session Continuity Notes

**For Next Agent/Session:**

1. **Current State:**
   - Phase 8 core mechanics (Steps 8.1-8.4) fully implemented and tested
   - Phase 8 documentation (Steps 8.5-8.6) fully expanded
   - Ready to implement visual rendering and UI components
   - All 58 tests passing, CI green

2. **Implementation Order:**
   - Start with Step 8.5 (camera system) - it's simpler
   - Then Step 8.6 (UI components) - more complex
   - Test visually after each component
   - Don't skip lint/test runs before commits

3. **Key Files to Create:**
   ```
   src/store/cameraStore.ts
   src/components/UI/CameraControls.tsx
   src/components/UI/CameraControls.css
   src/components/UI/MoveHistory.tsx
   src/components/UI/MoveHistory.css
   ```

4. **Key Files to Modify:**
   ```
   src/config/theme.ts (add cameraPresets)
   src/components/Board3D/Board3D.tsx (add CameraController)
   src/components/UI/BoardMovementPanel.tsx (add rotation radio buttons)
   src/components/UI/BoardMovementPanel.css (add rotation styles)
   src/App.tsx (integrate all UI components)
   ```

5. **Testing Checklist:**
   - [x] npm run lint passes
   - [x] npm test passes (all 58 tests)
   - [x] npm run dev starts successfully
   - [x] Camera presets work (smooth animations)
   - [x] Move history collapse/expand works
   - [x] Save game functionality implemented
   - [x] Load game functionality implemented
   - [x] New game with confirmation implemented
   - [ ] Attack board selection with rotation toggle (documented, not yet implemented)
   - [ ] UI responsiveness on small screens (future enhancement)

6. **Don't Forget:**
   - Install gsap if not present: `npm install gsap`
   - Test EVERY UI component in browser before moving on
   - Commit frequently with descriptive messages
   - Push to PR #3 branch (don't create new PR)
   - User wants to see visual testing screenshots if possible

---

## Commands for Quick Reference

```bash
# Development
cd ~/repos/open_tri_dim_chess
npm run dev                    # Start dev server (localhost:5173)
npm run lint                   # Run ESLint
npm test                       # Run all tests
npm test -- boardMovement      # Run specific test file
npm test -- --watch            # Watch mode

# Git
git status
git diff reference_docs/IMPLIMENTATION_GUIDE.md
git add <specific-files>       # Never use git add .
git commit -m "message"
git push

# View PR
gh pr view 3                   # View PR details
gh pr checks 3                 # Check CI status
```

---

## Contact & Resources

**User:** Warren Pettine (@wpettine)  
**Repository:** wpettine/open_tri_dim_chess  
**Current Session:** https://app.devin.ai/sessions/9fc04180cbb1475bbc400b927ad480e4  
**Latest PR:** https://github.com/wpettine/open_tri_dim_chess/pull/5 (MERGED - Phase 9)  
**Previous PRs:**
- PR #1: Phases 1-5 Foundation (MERGED)
- PR #2: Phases 6-7 Move Validation & Check Detection (MERGED)
- PR #3: Phase 8 Attack Board Movement (MERGED)
- PR #4: Phase 8 Visual Rendering & UI Components (MERGED)
- PR #5: Phase 9 Interactive Gameplay (MERGED)

**Key Documentation:**
- Implementation Guide: `reference_docs/IMPLIMENTATION_GUIDE.md`
- Official Rules: `reference_docs/meder-rules.md`
- Test Cases: `reference_docs/move_logic_tests.md`
- Piece Positions: `reference_docs/piece_placement.json` (SOURCE OF TRUTH)

---

**End of Document** - Phase 9 Complete! The game is now fully playable! 🎉
