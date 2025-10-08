# Claude Code Handoff Document

## Project Overview
Tri-Dimensional Chess implementation based on Jens Meder's Tournament Rules. This is a 3D chess variant played on 7 boards (3 main boards + 4 movable attack boards) with standard chess pieces following special 3D movement rules.

## Current Implementation Status

### ✅ COMPLETED: Phases 1-6, 9 (Foundation + Movement + User Interaction)

#### Phase 1: Project Setup
- **Tech Stack**: Vite + React 18 + TypeScript
- **3D Rendering**: Three.js via @react-three/fiber v8.17.10 + @react-three/drei v9.114.3
  - **IMPORTANT**: Using older versions for React 18 compatibility (v9+ requires React 19)
- **State Management**: Zustand v5.0.8
- **Testing**: Vitest + jsdom
- **Build Tool**: Vite
- **Status**: ✅ All dependencies installed, builds successfully

#### Phase 2: World Grid System (CRITICAL FOUNDATION)
**Location**: `src/engine/world/`

**Core Architecture Decision**: Pre-computed world grid with single source of truth for coordinates.

**Key Files**:
- `coordinates.ts`: Core coordinate mapping functions
  - `fileToWorldX(file: number): number` - Maps file index (0-5) to 3D X coordinate
  - `rankToWorldY(rank: number): number` - Maps rank (0-9) to 3D Y coordinate
  - `createSquareId(file, rank, level): string` - Creates unique square IDs like "a2W"
  - **CRITICAL**: These functions ensure same file = same X, same rank = same Y across ALL boards

- `types.ts`: Core type definitions
  - `WorldSquare`: Single source of truth for square positions (includes worldX, worldY, worldZ)
  - `BoardLayout`: Board metadata (center position, size, rotation)
  - `PinPosition`: Attack board docking positions (12 total: QL1-6, KL1-6)
  - `ChessWorld`: Complete game world (squares Map, boards Map, pins Map)

- `pinPositions.ts`: Defines 12 pin positions for attack board movement
  - QL1-6: Queen-side pins (files z-a, ranks 0-1, 2-3, 4-5, 6-7, 8-9, 8-9)
  - KL1-6: King-side pins (files d-e, ranks 0-1, 2-3, 4-5, 6-7, 8-9, 8-9)
  - Z-heights: 7.5 (white attack), 12.5 (mid-level), 17.5 (black attack)
  - `getInitialPinPositions()`: Returns starting pins (WQL→QL1, WKL→KL1, BQL→QL6, BKL→KL6)

- `worldBuilder.ts`: Creates the complete game world
  - **Main Boards**: All 4×4 (files a-d, 16 squares each)
    - White (W): ranks 1-4, Z=5
    - Neutral (N): ranks 3-6, Z=10
    - Black (B): ranks 5-8, Z=15
  - **Attack Boards**: All 2×2 (4 squares each)
    - WQL: files z-a, ranks 0-1, Z=7.5 (at QL1)
    - WKL: files d-e, ranks 0-1, Z=7.5 (at KL1)
    - BQL: files z-a, ranks 8-9, Z=17.5 (at QL6)
    - BKL: files d-e, ranks 8-9, Z=17.5 (at KL6)
  - **Total**: 64 squares (48 main + 16 attack)
  - **Overlaps**: W↔N at ranks 3-4, N↔B at ranks 5-6 (same X/Y, different Z)

**Status**: ✅ Complete, all squares pre-computed with correct coordinates

#### Phase 3: Validation Framework
**Location**: `src/engine/world/__tests__/`

**Test Files**:
- `worldBuilder.test.ts`: 9 tests validating world creation
- `coordinateValidation.test.ts`: 11 tests validating coordinate consistency

**Key Validations**:
- Rank continuity: Same rank has same Y across all boards
- File consistency: Same file has same X across all boards
- Board overlaps: W and N share ranks 3-4, N and B share ranks 5-6
- Square counts: W=16, N=16, B=16, each attack=4

**Status**: ✅ 20/20 tests passing

#### Phase 4: 3D Rendering
**Location**: `src/components/Board3D/`

**Key Files**:
- `Board3D.tsx`: Main Canvas setup with camera and lighting
  - Camera: position [15, 15, 25], fov 50
  - OrbitControls for interactive view
  - Ambient + directional lighting

- `BoardRenderer.tsx`: Renders all 7 boards as 3D platforms
  - Main boards: Brown (#8B4513)
  - Attack boards: Orange (#FF8C00)
  - Uses pre-computed worldX, worldY, worldZ from ChessWorld

- `Pieces3D.tsx`: Renders all chess pieces
  - Simple geometric shapes (cones, boxes, cylinders, octahedrons)
  - Positioned using WorldSquare coordinates + 0.5 Z-offset
  - **Debug feature**: Console logs all piece positions on mount

**Visual Theme** (`src/config/theme.ts`):
- Scene background: #1a1a2e
- Light squares: #f0d9b5, Dark squares: #b58863
- White pieces: #f5f5dc, Black pieces: #2c2c2c
- Camera settings, material properties (metalness, roughness)

**Status**: ✅ All 7 boards and pieces rendering correctly

#### Phase 5: Game State Management
**Location**: `src/store/gameStore.ts`, `src/engine/initialSetup.ts`

**Initial Piece Setup** (32 pieces total):
- **CRITICAL UPDATE**: User provided correct placement via `piece_placement.json`
- The initial setup in `initialSetup.ts` was REWRITTEN to match the JSON exactly
- **Current setup** (as of latest file modification):
  - White attack boards: Rooks, Queen/King, 4 pawns on QL1/KL1
  - Black attack boards: Rooks, Queen/King, 4 pawns on QL6/KL6
  - White main (W): Knights, Bishops, 4 pawns on ranks 1-2
  - Black main (B): Knights, Bishops, 4 pawns on ranks 7-8

**Game Store** (Zustand):
- `world: ChessWorld` - Pre-computed game world
- `pieces: Piece[]` - All 32 pieces with position + hasMoved flag
- `currentTurn: 'white' | 'black'`
- `selectedSquareId: string | null`
- `highlightedSquareIds: string[]`
- Check/checkmate/stalemate tracking
- Move history

**Status**: ✅ Complete, pieces correctly positioned according to user's JSON reference

#### Phase 6: Movement Validation (COMPLETED)
**Location**: `src/engine/movement/`

**Core Architecture**: Piece-specific validators with centralized orchestration and path validation.

**Key Files**:
- `index.ts`: Main entry point
  - `isValidMove(pieceId, fromSquareId, toSquareId, pieces, world, currentTurn): MoveValidation`
  - `getValidMoves(pieceId, pieces, world, currentTurn): string[]`
  - Orchestrates all piece-specific validators

- `types.ts`: Movement-specific types
  - `MoveContext`: All data needed for move validation
  - `MoveValidation`: Result with valid flag and reason
  - `PieceState`: Lightweight piece representation for validation
  - `PathStep`: Single step in a movement path

- `pathValidation.ts`: Core 3D movement utilities
  - `isPathClear()`: Validates straight paths with Vertical Shadow detection
  - `isPurelyVerticalMove()`: Detects prohibited same-file-rank-different-level moves
  - `generateStraightPath()`: Creates path steps for rank/file/diagonal moves
  - `getOccupiedColumns()`: Maps all occupied file-rank positions
  - `isBlockedByVerticalShadow()`: Critical Vertical Shadow implementation

**Piece Validators** (`src/engine/movement/pieces/`):
- `rook.ts`: Straight lines (rank/file), crosses levels, respects Vertical Shadow
- `bishop.ts`: Diagonals, crosses levels, respects Vertical Shadow
- `knight.ts`: L-shape (2+1 or 1+2), **IGNORES Vertical Shadow**, can jump
- `queen.ts`: Combines Rook + Bishop movement
- `king.ts`: One square any direction, can cross levels
- `pawn.ts`: Forward movement (1 or 2 on first move), diagonal captures (can cross levels), passenger awareness

**Critical 3D Rules Implemented**:
1. ✅ **Vertical Shadow Principle**: Pieces block entire file-rank columns on all levels (except Knights)
2. ✅ **Prohibition of Purely Vertical Movement**: Cannot move same file+rank to different level
3. ✅ **Level Transitions**: Pieces can move between overlapping boards as part of normal moves
4. ✅ **Knight Exemption**: Knights ignore Vertical Shadow and jump over pieces
5. ✅ **Pawn Passenger Awareness**: Pawns that moved with attack boards lose double-move privilege

**Tests** (`src/engine/movement/__tests__/`):
- `rook.test.ts`: 8 tests (file/rank movement, level crossing, Vertical Shadow, purely vertical)
- `knight.test.ts`: 7 tests (L-shape, level crossing, Vertical Shadow immunity)
- `pawn.test.ts`: 12 tests (forward, double-move, captures, passenger state)
- **Total**: 27 movement tests, all passing

**Game Store Integration** (`src/store/gameStore.ts`):
- `selectSquare(squareId)`: Selects piece and highlights valid moves
- `movePiece(fromSquareId, toSquareId)`: Validates and executes moves
- `getValidMovesForSquare(squareId)`: Gets all valid destinations for highlighting
- Automatic turn switching after valid moves
- Capture handling (removes captured pieces)
- Move history tracking

**Status**: ✅ Complete - All 47 tests passing (20 world + 27 movement)

#### Phase 9: User Interaction (COMPLETED)
**Location**: `src/components/Board3D/`, `src/components/UI/`

**Interactive Features Implemented**:

**Piece Selection** (`Pieces3D.tsx`):
- Click pieces to select them
- Visual feedback: Selected pieces glow yellow and lift up
- Hover effect: Pieces lift slightly and change color on hover
- Cursor changes to pointer on hover
- Only current player's pieces can be selected

**Move Execution** (`BoardRenderer.tsx`):
- Valid move squares highlighted in bright green
- Click highlighted square to execute move
- Hover effect on valid move squares (brighter green)
- Automatic turn switching after valid move
- Piece capture handling
- Click empty square to deselect

**Visual Feedback**:
- **Selected piece**: Yellow glow + lifted 0.5 units + emissive effect
- **Hovered piece**: Light gray tint + lifted 0.2 units
- **Valid moves**: Bright green squares with emissive glow
- **Hovered valid move**: Even brighter green
- **Cursor**: Pointer on interactive elements

**Turn Indicator UI** (`TurnIndicator.tsx`):
- Displays current player's turn (WHITE/BLACK)
- Piece count for both players
- Move count
- Instructions for new players
- Semi-transparent dark background overlay
- Positioned top-left corner

**User Experience**:
1. Click a piece to select it (your color, your turn)
2. Valid moves highlight in green
3. Click green square to move
4. Turn automatically switches
5. Repeat for next player

**Status**: ✅ Complete - Game is fully playable!

## Known Issues & Important Notes

### 1. Piece Placement Confusion (RESOLVED)
- **Issue**: Initial implementation based on Table 1 from `move_logic_tests.md` was incomplete/incorrect
- **Resolution**: User corrected this by providing `piece_placement.json` with exact positions
- **Current State**: `initialSetup.ts` now correctly implements all 32 pieces from the JSON
- **Lesson**: Always trust the visual/JSON reference over textual descriptions

### 2. Board Size Discrepancy (RESOLVED)
- **Issue**: Meder rules state "4×4 boards" but some documentation implied file 'e' was on main boards
- **Resolution**: Main boards are strictly 4×4 (files a-d). Attack boards extend to files z and e.
- **Current State**: W/N/B are 4×4, attack boards are 2×2 at edges

### 3. React Three Fiber Version (CRITICAL)
- **Issue**: Version 9+ requires React 19
- **Resolution**: Pinned to v8.17.10 for React 18 compatibility
- **Action**: Do NOT upgrade R3F until React is upgraded to v19
- **File**: See `FIXED.md` for details

### 4. Attack Board Z-Heights
- **Current values**: 7.5 (white), 12.5 (mid), 17.5 (black)
- **Rationale**: Float between main boards to show 3D structure
- **Note**: User confirmed these are correct after visual verification

## File Structure

```
src/
├── engine/
│   ├── world/
│   │   ├── __tests__/
│   │   │   ├── worldBuilder.test.ts
│   │   │   └── coordinateValidation.test.ts
│   │   ├── coordinates.ts          # SINGLE SOURCE OF TRUTH
│   │   ├── types.ts                # Core type definitions
│   │   ├── pinPositions.ts         # 12 attack board pins
│   │   └── worldBuilder.ts         # Creates game world
│   ├── movement/
│   │   ├── __tests__/
│   │   │   ├── rook.test.ts        # Rook movement tests
│   │   │   ├── knight.test.ts      # Knight movement tests
│   │   │   └── pawn.test.ts        # Pawn movement tests
│   │   ├── pieces/
│   │   │   ├── rook.ts             # Rook validator
│   │   │   ├── bishop.ts           # Bishop validator
│   │   │   ├── knight.ts           # Knight validator
│   │   │   ├── queen.ts            # Queen validator
│   │   │   ├── king.ts             # King validator
│   │   │   └── pawn.ts             # Pawn validator
│   │   ├── index.ts                # Main movement API
│   │   ├── types.ts                # Movement types
│   │   └── pathValidation.ts       # Path & shadow utilities
│   ├── initialSetup.ts             # Piece placement (from JSON)
│   └── types.ts                    # Piece types
├── components/
│   ├── Board3D/
│   │   ├── Board3D.tsx             # Main Canvas
│   │   ├── BoardRenderer.tsx       # Renders boards + click handlers
│   │   └── Pieces3D.tsx            # Renders pieces + selection
│   ├── UI/
│   │   └── TurnIndicator.tsx       # Turn display + game info
│   └── Debug/
│       └── WorldGridVisualizer.tsx # Debug wireframes
├── store/
│   └── gameStore.ts                # Zustand state + move logic
├── config/
│   └── theme.ts                    # Visual theme
└── utils/
    └── debugLogger.ts              # Console logging
```

## Critical Architecture Principles

### 1. Pre-Computed World Grid
- World grid is created ONCE at initialization by `createChessWorld()`
- ALL positions (worldX, worldY, worldZ) are pre-computed and stored
- Rendering components READ positions, never calculate them
- This ensures perfect alignment: same rank = same Y, same file = same X

### 2. Coordinate System
- Files: z=0, a=1, b=2, c=3, d=4, e=5
- Ranks: 0-9 (continuous across all boards)
- Levels: W, N, B, WQL, WKL, BQL, BKL
- Square IDs: `${file}${rank}${level}` (e.g., "a2W", "z0WQL")

### 3. Board Overlaps
- Main boards share rank ranges but different Z-heights
- W and N overlap at ranks 3-4
- N and B overlap at ranks 5-6
- This creates the stair-step 3D structure

### 4. Attack Board Movement
- Attack boards can move to any of 6 pins (QL1-6 or KL1-6)
- Movement requires regenerating squares at new position
- Pin positions define fileOffset, rankOffset, zHeight
- This is NOT YET IMPLEMENTED

## What Remains: Phases 7-8, 10

### Phase 7: Attack Board Movement (NOT STARTED - OPTIONAL)
**Rules**:
- Player can move ONE attack board instead of a piece on their turn
- Board can move to any valid pin (6 positions per side)
- Cannot move if any piece on it would capture opponent's King at new position
- All pieces on board move with it ("passengers")
- Passengers gain `movedAsPassenger: true` flag (affects pawn double-move rights)

**Implementation Needed**:
- `moveAttackBoard(boardId, newPinId, world, pieces): {world, pieces, valid}`
- Validation: Check for instant check/checkmate
- Update board position in ChessWorld
- Regenerate squares for moved board
- Update piece positions for passengers
- Tests for all pin transitions

### Phase 8: Game Logic (NOT STARTED)
- Check detection
- Checkmate detection
- Stalemate detection
- Move history (notation)
- Undo/redo
- Draw conditions (50-move rule, threefold repetition)

### Phase 10: Polish (NOT STARTED)
- 3D piece models (replace geometric shapes)
- Animations (piece movement, board movement)
- Sound effects
- Move notation display
- Game save/load
- AI opponent (optional)

## Development Commands

```bash
# Install dependencies
npm install --legacy-peer-deps

# Development server
npm run dev
# Opens at http://localhost:5173/

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing Strategy

**World Tests** (`src/engine/world/__tests__/`):
- World creation: Validates board/square counts
- Coordinate validation: Ensures rank/file consistency
- 20/20 tests passing

**Movement Tests** (`src/engine/movement/__tests__/`):
- Rook: File/rank movement, level crossing, Vertical Shadow blocking
- Knight: L-shape, Vertical Shadow immunity, jumping
- Pawn: Forward movement, double-move, diagonal captures, passenger state
- 27/27 tests passing

**Total**: 47/47 tests passing ✅

**Next phase needs**:
- Attack board movement tests
- Check/checkmate detection tests
- En passant and castling tests
- Special move tests

## Important References

- **Meder Rules**: `reference_docs/meder-rules.md` - Official tournament rules
- **Movement Tests**: `reference_docs/move_logic_tests.md` - Comprehensive test scenarios
- **Implementation Guide**: `reference_docs/IMPLIMENTATION_GUIDE.md` - Step-by-step guide (phases 1-5 complete)
- **Piece Placement**: `reference_docs/piece_placement.json` - Authoritative initial setup
- **Design Doc**: `reference_docs/DESIGN_DOC.md` - Original design decisions

## Quick Start for Next Agent

1. **Read this document first** to understand current state
2. **Run tests**: `npm test` - Should see 47/47 passing
3. **Start dev server**: `npm run dev` - Visit http://localhost:5173/
4. **Play the game!**:
   - Click a white piece to select it
   - Valid moves will glow green
   - Click a green square to move
   - Turn switches to black automatically
   - Repeat!
5. **Next priorities**:
   - Phase 8: Check/Checkmate detection (important for game completion)
   - Phase 10: Polish (animations, better piece models, sound effects)
   - Phase 7: Attack Board Movement (optional advanced feature)

## Debug Tools

- **Console logging**: Piece positions logged on mount (see `Pieces3D.tsx`)
- **World grid debug**: Available in `src/utils/debugLogger.ts`
- **Visualizer**: `WorldGridVisualizer.tsx` (can be enabled for wireframes)
- **Browser DevTools**: F12 to inspect Three.js scene

## Git Status

- Current branch: `claude-dev`
- Last commit: fc246d8 "Implement Phases 1-5: Core 3D Chess Foundation"
- All source files committed
- `.gitignore` configured (excludes node_modules/, dist/)

## Final Notes

1. **Coordinate system is SOLID** - Don't change `coordinates.ts` without re-running ALL tests
2. **Piece placement is CORRECT** - Matches user's JSON, verified visually
3. **React Three Fiber version is PINNED** - Don't upgrade until React 19
4. **Movement validation is COMPLETE** - All piece types working with Vertical Shadow
5. **Game is PLAYABLE** - Full click-to-move interaction working
6. **Missing features**: Check/checkmate detection, en passant, castling, attack board movement
7. **Next priority**: Implement check/checkmate detection (Phase 8)

## Questions for Next Agent

If you need clarification:
1. Check `reference_docs/` first
2. Run existing tests to understand expected behavior
3. Look at `worldBuilder.ts` to understand coordinate system
4. Check `initialSetup.ts` for current piece placement
5. Review `move_logic_tests.md` for movement rules

Good luck! The game is now playable with full 3D interaction! Next up: check/checkmate detection to complete the core game rules. 🚀♟️
