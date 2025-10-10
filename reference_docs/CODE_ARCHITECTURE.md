# Code Architecture Reference

**Project:** Open Tri-Dimensional Chess  
**Purpose:** Comprehensive architectural documentation for AI agents and developers  
**Last Updated:** October 10, 2025

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Architecture Principles](#core-architecture-principles)
3. [Directory Structure](#directory-structure)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Core Systems Deep Dive](#core-systems-deep-dive)
6. [File-by-File Reference](#file-by-file-reference)
7. [Key Functions Reference](#key-functions-reference)
8. [State Management](#state-management)
9. [Rendering Pipeline](#rendering-pipeline)
10. [Move Validation System](#move-validation-system)
11. [Attack Board Movement System](#attack-board-movement-system)
12. [Testing Strategy](#testing-strategy)
13. [Common Patterns](#common-patterns)
14. [Troubleshooting Guide](#troubleshooting-guide)

---

## System Overview

### What This Application Does

This is a web-based implementation of **Tri-Dimensional Chess** (Raumschach), a 3D chess variant played on seven boards arranged vertically:
- 3 static main boards (White's Board, Neutral Board, Black's Board)
- 4 movable attack boards (2 per player: Queen's Line and King's Line)

The game implements the revised Meder coordinate system using a **visibility-based architecture** where attack board instances are pre-created at all possible positions and toggled on/off to simulate movement.

### Technology Stack

- **Frontend Framework:** React 19.2.0 + TypeScript 5.9.3
- **3D Rendering:** Three.js 0.169.0 via @react-three/fiber 9.1.0 and @react-three/drei 9.114.3
- **State Management:** Zustand 5.0.0
- **Animation:** GSAP 3.13.0
- **Build Tool:** Vite 7.1.7
- **Testing:** Vitest 2.1.4 + Playwright 1.56.0
- **Validation:** Zod 3.23.8

### Key Design Decisions

1. **Pre-Computed Coordinate System:** All spatial coordinates are calculated once at initialization and stored in a `ChessWorld` object
2. **Visibility-Toggle Attack Boards:** Instead of moving 3D objects, we pre-create 48 attack board instances (12 pins × 2 tracks × 2 rotations) and toggle visibility
3. **Validation-First Approach:** Coordinate system validation is mandatory before game logic implementation
4. **Single Source of Truth:** Components never calculate positions; they only read from `ChessWorld`

---

## Core Architecture Principles

### 1. World Grid System: The Foundation


**The World Grid System is the absolute foundation of this codebase.** Every component, every calculation, every rendering decision stems from this pre-computed coordinate system.

**Core Concept:** At initialization, `createChessWorld()` computes ALL square positions for ALL boards (including 48 attack board instances) and stores them in a `ChessWorld` object. Components NEVER calculate positions at runtime; they ONLY read from this single source of truth.

**Why This Matters:** A previous implementation failed due to "unsolvable coordinate bugs" where different parts of the code calculated positions differently. This architecture ensures coordinates are computed ONCE, in ONE place, and validated BEFORE any game logic runs.

### 2. Visibility-Based Attack Board System

Instead of moving attack boards in 3D space (which causes complex coordinate updates), we use a visibility-toggle system:

**Pre-Creation:**
- 24 Queen's Line instances (QL1:0, QL1:180, QL2:0, QL2:180, ..., QL6:0, QL6:180)
- 24 King's Line instances (KL1:0, KL1:180, KL2:0, KL2:180, ..., KL6:0, KL6:180)
- Total: 48 attack board instances

**Runtime Visibility:**
- Only 4 instances are visible at any time (White QL, White KL, Black QL, Black KL)
- Moving a board = hiding old instance + showing new instance
- No 3D transforms, no coordinate recalculation

**Benefits:**
- Predictable coordinates (all pre-computed)
- Simple state management (just track which instance is active)
- No coordinate bugs from runtime calculations
- Efficient rendering (only 4 visible out of 48)

### 3. Track-Based Organization

The system models the physical reality of attack board tracks:

**Two Tracks:**
- Queen's Line (QL): Left side, files z/a
- King's Line (KL): Right side, files d/e

**Six Pins Per Track:**
- QL1-QL6 (Queen's Line pins 1-6)
- KL1-KL6 (King's Line pins 1-6)

**Two Boards Per Track:**
- Each track has one White board and one Black board
- Boards move between pins on their track
- Cross-track movement is allowed (QL ↔ KL at same pin number)

### 4. Type Safety and Validation

**TypeScript:** Strict type checking throughout
**Zod Schemas:** Runtime validation for persistence
**Test-Driven:** Coordinate validation tests must pass before game logic
**LSP Tools:** Use language server for type exploration

---

## Directory Structure

```
src/
├── engine/                          # Core game logic (NO React dependencies)
│   ├── world/                       # World Grid System (MOST CRITICAL)
│   │   ├── types.ts                 # Core interfaces: WorldSquare, BoardLayout, ChessWorld
│   │   ├── worldBuilder.ts          # createChessWorld() - THE FOUNDATION FUNCTION
│   │   ├── coordinates.ts           # fileToWorldX(), rankToWorldY() - coordinate functions
│   │   ├── coordinatesTransform.ts  # Arrival choice logic for attack board passengers
│   │   ├── pinPositions.ts          # 12 pin position definitions with z-heights
│   │   ├── attackBoardAdjacency.ts  # Pin neighbor graph, direction classification
│   │   ├── worldMutation.ts         # Attack board movement validation & execution
│   │   ├── visibility.ts            # updateInstanceVisibility() - visibility toggle logic
│   │   ├── ownership.ts             # Pin ownership and controller helpers
│   │   └── __tests__/               # Coordinate validation tests (MUST PASS)
│   │
│   ├── validation/                  # Move validation and game rules
│   │   ├── checkDetection.ts        # Check, checkmate, stalemate detection
│   │   ├── moveValidator.ts         # getLegalMoves() - main move validation entry
│   │   ├── pieceMovement.ts         # Per-piece movement rules (pawn, rook, etc.)
│   │   ├── pathValidation.ts        # Path blocking, vertical shadow rules
│   │   ├── types.ts                 # Validation interfaces
│   │   └── __tests__/               # Move validation tests
│   │
│   └── initialSetup.ts              # createInitialPieces() - starting position
│
├── store/                           # State management (Zustand)
│   ├── gameStore.ts                 # Main game state (pieces, turn, world, trackStates)
│   └── cameraStore.ts               # Camera view presets
│
├── components/                      # React components
│   ├── Board3D/                     # 3D rendering components
│   │   ├── Board3D.tsx              # Three.js canvas, lighting, camera setup
│   │   ├── BoardRenderer.tsx        # Renders all 7 boards from ChessWorld
│   │   ├── Pieces3D.tsx             # Renders all pieces by reading square positions
│   │   └── __tests__/               # Component tests (scenegraph validation)
│   │
│   ├── UI/                          # UI overlays
│   │   ├── GameStatus.tsx           # Turn, check, checkmate display
│   │   ├── MoveHistory.tsx          # Move list display
│   │   ├── CameraControls.tsx       # Camera preset buttons
│   │   ├── AttackBoardControls.tsx  # Attack board selection UI
│   │   ├── ArrivalOverlay.tsx       # Arrival choice selection during activation
│   │   ├── SaveLoadManager.tsx      # Game persistence UI
│   │   └── RailPins.tsx             # Pin visualization helpers
│   │
│   ├── Debug/                       # Debug/validation tools
│   │   └── WorldGridVisualizer.tsx  # Visual coordinate validation (Phase 3)
│   │
│   └── App.tsx                      # Root component
│
├── persistence/                     # Game save/load system
│   ├── GamePersistence.ts           # Abstract persistence interface
│   ├── localStoragePersistence.ts   # LocalStorage implementation
│   ├── schema.ts                    # Zod schemas for validation
│   └── utils.ts                     # Serialization helpers
│
├── utils/                           # Utility functions
│   ├── debugLogger.ts               # logWorldCoordinates() for debugging
│   └── resolveBoardId.ts            # Maps piece.level to active instance ID
│
├── config/                          # Configuration
│   └── theme.ts                     # THEME object: colors, sizes, camera presets
│
├── test/                            # Test utilities
│   ├── setup.ts                     # Vitest configuration
│   ├── threeTestUtils.tsx           # Three.js testing helpers
│   └── storeFixtures.ts             # Test data fixtures
│
└── main.tsx                         # Application entry point

reference_docs/                      # Documentation (CRITICAL READING)
├── NEW_WORLD_STRUCTURE.md           # AUTHORITATIVE phase requirements
├── DESIGN_DOC.md                    # Architecture decisions (deprecated)
├── IMPLEMENTATION_GUIDE.md          # Old phase guide (obsolete)
└── CODE_ARCHITECTURE.md             # This file
```

---

## Data Flow Architecture

Understanding how data flows through the application is critical to working with the codebase effectively.

### Application Initialization

```
main.tsx
  ↓
App.tsx (renders UI + Board3D)
  ↓
useGameStore (Zustand initialization)
  ↓
createChessWorld() ← THE CRITICAL FUNCTION
  ↓
Creates all 27 board instances + 100+ squares
  ↓
updateInstanceVisibility() - shows 4 initial instances
  ↓
createInitialPieces() - 32 pieces at starting positions
  ↓
Game ready for interaction
```

### Piece Movement Flow

```
User clicks square
  ↓
selectSquare(squareId)
  ↓
Find piece at square → getValidMovesForSquare()
  ↓
getLegalMovesAvoidingCheck(piece, world, pieces)
  ↓
For each potential move:
  - getLegalMoves() → validates piece-specific rules
  - simulateMove() → check if king safe
  ↓
Highlight valid moves
  ↓
User clicks destination
  ↓
movePiece(piece, toFile, toRank, toLevel)
  ↓
Update pieces array, check game state
  ↓
Switch turn, re-render
```

### Attack Board Activation Flow

```
User selects attack board → selectBoard(boardId)
  ↓
User clicks pin location → setArrivalSelection(toPinId)
  ↓
Calculate arrival options:
  getArrivalOptions() → returns 2 choices (identity, rot180)
  ↓
Show ArrivalOverlay
  ↓
User selects choice → moveAttackBoard(boardId, toPinId, arrivalChoice)
  ↓
validateActivation() - check adjacency, occupancy, shadows
  ↓
executeActivation() - remap pieces, update positions
  ↓
Update trackStates with new pin/rotation
  ↓
updateInstanceVisibility() - hide old, show new instance
  ↓
Re-render scene
```

---

## Core Systems Deep Dive

### World Grid System Details

**File: `src/engine/world/worldBuilder.ts`**

The `createChessWorld()` function is the foundation. It creates 27 board instances:
- 3 main boards (WL, NL, BL)
- 24 attack board instances (QL1:0, QL1:180, ..., KL6:180)

Each board has 4-16 squares, each with pre-computed `worldX`, `worldY`, `worldZ` coordinates.

**Key insight:** This function is called ONCE. Coordinates never change after initialization.

**File: `src/engine/world/coordinates.ts`**

```typescript
export function fileToWorldX(file: number): number {
  return file * BOARD_SPACING; // BOARD_SPACING = 2.1
}

export function rankToWorldY(rank: number): number {
  return rank * BOARD_SPACING;
}
```

These functions convert game coordinates (file 0-5, rank 0-9) to Three.js world coordinates. They are ONLY called during world creation.

**File: `src/engine/world/visibility.ts`**

```typescript
export function updateInstanceVisibility(world: ChessWorld, trackStates: TrackStates) {
  // Hide all attack board instances
  world.boards.forEach(b => {
    if (b.type === 'attack') b.isVisible = false;
  });
  
  // Show only 4 active instances based on trackStates
  const whiteQLInstance = `QL${trackStates.QL.whiteBoardPin}:${trackStates.QL.whiteRotation}`;
  world.boards.get(whiteQLInstance).isVisible = true;
  // ... same for White KL, Black QL, Black KL
}
```

This is called after every attack board activation to update which instances are visible.

### State Management Details

**File: `src/store/gameStore.ts`**

The Zustand store contains:
- `world: ChessWorld` - The pre-computed coordinate system
- `pieces: Piece[]` - All pieces with file/rank/level coordinates
- `trackStates` - Which pin each board occupies
- `selectedSquareId`, `highlightedSquareIds` - UI state
- Actions: `selectSquare()`, `movePiece()`, `moveAttackBoard()`, etc.

**Critical function: `resolveBoardId()`** (in `src/utils/resolveBoardId.ts`)

```typescript
export function resolveBoardId(level: string, attackBoardStates?: AttackBoardStates): string {
  if (level === 'W' || level === 'N' || level === 'B') return level;
  
  // For attack boards, look up active instance
  const active = attackBoardStates?.[level]?.activeInstanceId;
  return active ?? level; // e.g., 'QL1:0'
}
```

This bridges piece storage (board IDs like 'WQL') with rendering (instance IDs like 'QL1:0').

### Move Validation System Details

**File: `src/engine/validation/moveValidator.ts`**

```typescript
export function getLegalMoves(piece: Piece, world: ChessWorld, allPieces: Piece[]): string[] {
  const legalMoves: string[] = [];
  
  // Check EVERY square in the world
  for (const [squareId, square] of world.squares) {
    const context = { piece, fromSquare, toSquare: square, world, allPieces };
    const result = validateMoveForPiece(context);
    
    if (result.valid) {
      legalMoves.push(squareId);
    }
  }
  
  return legalMoves;
}
```

Delegates to piece-specific validators in `pieceMovement.ts`.

**File: `src/engine/validation/checkDetection.ts`**

```typescript
export function getLegalMovesAvoidingCheck(piece: Piece, world: ChessWorld, pieces: Piece[]): string[] {
  const allMoves = getLegalMoves(piece, world, pieces);
  
  // Filter out moves that leave king in check
  return allMoves.filter(toSquareId => {
    const { newPieces } = simulateMove(pieces, piece, toSquareId, world);
    return !isInCheck(piece.color, world, newPieces);
  });
}
```

This is what `getValidMovesForSquare()` calls in the store.

### Rendering Pipeline Details

**File: `src/components/Board3D/BoardRenderer.tsx`**

```typescript
export function BoardRenderer() {
  const world = useGameStore(state => state.world);
  
  return (
    <group>
      {Array.from(world.boards.values()).map(board => (
        board.type === 'main' || board.isVisible ? (
          <SingleBoard key={board.id} board={board} />
        ) : null
      ))}
    </group>
  );
}
```

**Key pattern:** Only render boards where `board.type === 'main'` OR `board.isVisible === true`.

**File: `src/components/Board3D/Pieces3D.tsx`**

```typescript
export function Pieces3D() {
  const pieces = useGameStore(state => state.pieces);
  const world = useGameStore(state => state.world);
  const attackBoardStates = useGameStore(state => state.attackBoardStates);
  
  return (
    <group>
      {pieces.map(piece => {
        // Resolve board ID
        const boardId = resolveBoardId(piece.level, attackBoardStates);
        
        // Build square ID
        const squareId = `${fileToString(piece.file)}${piece.rank}${boardId}`;
        
        // Look up square
        const square = world.squares.get(squareId);
        
        // Render at pre-computed position
        return <SimplePiece position={[square.worldX, square.worldY, square.worldZ + 0.5]} />;
      })}
    </group>
  );
}
```

**Critical:** This is where `resolveBoardId()` is essential. Pieces store board IDs ('WQL'), but we need instance IDs ('QL1:0') to look up squares.

---

## File-by-File Reference

This section provides a comprehensive reference for every important file in the codebase.

### Engine Files

#### `src/engine/world/types.ts`
**Purpose:** Core TypeScript interfaces for the World Grid System  
**Key Exports:**
- `WorldSquare` - Represents a single square with game coordinates (file, rank, level) and 3D coordinates (worldX, worldY, worldZ)
- `BoardLayout` - Represents a board with center position, size, rotation, and visibility flags
- `ChessWorld` - The complete coordinate system (boards Map, squares Map, pins Map, adjacencyGraph)
- `PinPosition` - Pin definition with fileOffset, rankOffset, zHeight, adjacentPins
- `PinAdjacencyGraph` - Graph structure for pin neighbor relationships

**Critical for:** Understanding the data structures that underpin the entire system

#### `src/engine/world/worldBuilder.ts`
**Purpose:** Creates the entire World Grid System at initialization  
**Key Function:** `createChessWorld(): ChessWorld`  
**What it does:**
1. Creates 3 main boards (WL, NL, BL) with 48 total squares
2. Creates 24 attack board instances (12 pins × 2 rotations per track × 2 tracks) with 96 total squares
3. Returns complete ChessWorld with all coordinates pre-computed

**Critical for:** Understanding how the coordinate system is built

**Helper Functions:**
- `createMainBoard()` - Creates one main board with squares
- `createAttackBoardInstance()` - Creates one attack board instance at a specific pin/rotation

#### `src/engine/world/coordinates.ts`
**Purpose:** Coordinate transformation functions (INITIALIZATION ONLY)  
**Key Exports:**
- `fileToWorldX(file: number): number` - Converts file (0-5) to X coordinate
- `rankToWorldY(rank: number): number` - Converts rank (0-9) to Y coordinate
- `fileToString(file: number): string` - Converts file number to letter (z,a,b,c,d,e)
- `stringToFile(fileStr: string): number` - Converts file letter to number
- `createSquareId(file, rank, boardId): string` - Builds square ID like 'a2W'
- `parseSquareId(squareId): { file, rank, boardId }` - Parses square ID

**Critical Rule:** `fileToWorldX()` and `rankToWorldY()` are ONLY called during world creation, never in components

#### `src/engine/world/coordinatesTransform.ts`
**Purpose:** Arrival choice logic for attack board passengers  
**Key Exports:**
- `getArrivalOptions()` - Returns two arrival destinations (identity and rot180)
- `calculateArrivalCoordinates()` - Calculates arrival coordinates for a choice
- `translatePassenger()` - Simple translation (no rotation)
- `rotatePassenger180()` - 180° rotation transformation

**Used by:** Attack board activation flow when passenger needs to choose landing position

#### `src/engine/world/pinPositions.ts`
**Purpose:** Defines all 12 pin positions  
**Key Exports:**
- `PIN_POSITIONS` - Record of all 12 pin definitions
- `Z_WHITE_MAIN`, `Z_NEUTRAL_MAIN`, `Z_BLACK_MAIN` - Z-height constants
- `ATTACK_OFFSET` - How much attack boards float above main boards
- `getInitialPinPositions()` - Returns starting positions { WQL: 'QL1', WKL: 'KL1', BQL: 'QL6', BKL: 'KL6' }

**Critical for:** Understanding pin placement and initial setup

#### `src/engine/world/attackBoardAdjacency.ts`
**Purpose:** Pin neighbor graph and direction classification  
**Key Exports:**
- `ATTACK_BOARD_ADJACENCY` - Flat adjacency list (legacy)
- `PIN_ADJACENCY` - Structured adjacency graph by track
- `classifyDirection(fromPinId, toPinId, controller)` - Returns 'forward', 'backward', or 'side'
- `getPinLevel(pinId)` - Returns pin level (1-6)
- `makeInstanceId(track, pin, rotation)` - Builds instance ID like 'QL1:0'
- `parseInstanceId(id)` - Parses instance ID to components

**Used by:** Attack board validation to check adjacency and direction

#### `src/engine/world/visibility.ts`
**Purpose:** Manages which attack board instances are visible  
**Key Exports:**
- `updateInstanceVisibility(world, trackStates)` - Hides all instances, shows 4 active ones
- `showAllAttackInstances(world)` - Shows all instances (debug mode)
- `TrackStates` interface - Structure for tracking pin/rotation state

**Called:** After every attack board activation to update visibility

#### `src/engine/world/worldMutation.ts`
**Purpose:** Attack board movement validation and execution  
**Key Exports:**
- `validateActivation(context): BoardMoveValidation` - Validates attack board move
- `executeActivation(context): ActivationResult` - Executes move and remaps pieces
- `validateBoardMove()` - Legacy function (wrapped by validateActivation)
- `executeBoardMove()` - Legacy function (wrapped by executeActivation)

**Validation checks:** rotation, adjacency, direction, occupancy, vertical shadow, king safety  
**Execution:** Calculates offsets, remaps passengers, applies rotation, sets movedByAB flag

#### `src/engine/world/ownership.ts`
**Purpose:** Pin ownership and controller helper functions  
**Key Exports:**
- `getPinOwner(pinId, positions)` - Returns 'white', 'black', or null
- `getBoardController(boardId)` - Returns board's inherent color
- `getAdjacentPins(pinId)` - Returns array of adjacent pin IDs
- `isAdjacent(pinA, pinB)` - Boolean adjacency check
- `getVacantPins(fromPinId, positions)` - Returns unoccupied adjacent pins
- `deriveInstanceIdForBoard()` - Builds instance ID from board/pin/rotation

**Used by:** Attack board UI and validation

#### `src/engine/validation/checkDetection.ts`
**Purpose:** Check, checkmate, and stalemate detection  
**Key Exports:**
- `isInCheck(color, world, pieces): boolean` - Is this color in check?
- `isCheckmate(color, world, pieces): boolean` - Is this color checkmated?
- `isStalemate(color, world, pieces): boolean` - Is this color stalemated?
- `getLegalMovesAvoidingCheck(piece, world, pieces): string[]` - Legal moves that don't expose king
- `isSquareAttacked(square, byColor, world, pieces): boolean` - Can byColor attack this square?

**Used by:** Game state updates and move validation

#### `src/engine/validation/moveValidator.ts`
**Purpose:** Main move validation entry point  
**Key Exports:**
- `getLegalMoves(piece, world, pieces): string[]` - All legal moves (ignoring check)
- Internal: `validateMoveForPiece(context)` - Delegates to piece-specific validators

**Flow:** Iterates all squares, calls piece-specific validator, returns legal square IDs

#### `src/engine/validation/pieceMovement.ts`
**Purpose:** Piece-specific movement rules  
**Key Exports:**
- `validatePawnMove(context): MoveResult`
- `validateRookMove(context): MoveResult`
- `validateKnightMove(context): MoveResult`
- `validateBishopMove(context): MoveResult`
- `validateQueenMove(context): MoveResult`
- `validateKingMove(context): MoveResult`

**Each returns:** `{ valid: boolean, reason?: string }`

#### `src/engine/validation/pathValidation.ts`
**Purpose:** Path blocking and vertical shadow validation  
**Key Exports:**
- Path blocking functions for sliding pieces
- Vertical shadow rule enforcement
- Knight exception handling

#### `src/engine/initialSetup.ts`
**Purpose:** Creates starting piece positions  
**Key Export:** `createInitialPieces(): Piece[]`  
**Returns:** Array of 32 pieces at starting positions

### Store Files

#### `src/store/gameStore.ts`
**Purpose:** Main Zustand state store  
**Size:** ~800 lines - the largest file in the codebase  
**Key State:**
- `world: ChessWorld` - The coordinate system
- `pieces: Piece[]` - All pieces
- `trackStates` - Which pin each board occupies
- `currentTurn`, `isCheck`, `isCheckmate`, `isStalemate`, `gameOver`, `winner`
- `selectedSquareId`, `highlightedSquareIds`, `selectedBoardId`
- `moveHistory: Move[]`

**Key Actions:**
- `selectSquare(squareId)` - Select a square
- `movePiece(piece, toFile, toRank, toLevel)` - Execute piece move
- `selectBoard(boardId)` - Select attack board
- `setArrivalSelection(toPinId)` - Calculate arrival options
- `moveAttackBoard(boardId, toPinId, rotate, arrivalChoice)` - Execute activation
- `getValidMovesForSquare(squareId)` - Get legal moves
- `resetGame()`, `undoMove()`, `saveCurrentGame()`, `loadGameById()`

**Critical for:** Understanding how state flows through the application

#### `src/store/cameraStore.ts`
**Purpose:** Camera view presets  
**State:** `currentView: 'default' | 'top' | 'side' | 'front'`  
**Action:** `setCameraView(view)`

### Component Files

#### `src/components/Board3D/Board3D.tsx`
**Purpose:** Three.js canvas setup  
**Renders:**
- Canvas with camera and lighting
- CameraController (GSAP animations)
- BoardRenderer (all boards)
- Pieces3D (all pieces)

**Key:** Sets up the 3D environment

#### `src/components/Board3D/BoardRenderer.tsx`
**Purpose:** Renders all boards  
**Key Logic:**
- Iterates `world.boards.values()`
- Renders if `board.type === 'main'` OR `board.isVisible`
- Creates platform mesh, selector disk, pin markers, square meshes
- Handles click events for square and board selection

**Pattern:** Reads coordinates from `BoardLayout` and `WorldSquare`, never calculates

#### `src/components/Board3D/Pieces3D.tsx`
**Purpose:** Renders all pieces  
**Key Logic:**
1. Resolve `piece.level` to instance ID via `resolveBoardId()`
2. Build square ID: `${fileToString(piece.file)}${piece.rank}${boardId}`
3. Look up square in `world.squares`
4. Render at `[square.worldX, square.worldY, square.worldZ + 0.5]`

**Critical function:** `resolveBoardId()` - maps 'WQL' to 'QL1:0'

#### `src/components/UI/` files
- `GameStatus.tsx` - Turn, check, checkmate display
- `MoveHistory.tsx` - Move list with notation
- `CameraControls.tsx` - Camera preset buttons
- `AttackBoardControls.tsx` - Attack board selection UI
- `ArrivalOverlay.tsx` - Arrival choice selection modal
- `SaveLoadManager.tsx` - Game save/load UI
- `RailPins.tsx` - Pin visualization helpers

#### `src/components/Debug/WorldGridVisualizer.tsx`
**Purpose:** Visual coordinate validation tool  
**Renders:** Wireframe boxes and labels for all squares  
**Usage:** Enable in Board3D.tsx for Phase 3 validation

### Utility Files

#### `src/utils/resolveBoardId.ts`
**Purpose:** Maps piece.level to active instance ID  
**Key Function:** `resolveBoardId(level, attackBoardStates): string`  
**Logic:**
- If main board ('W', 'N', 'B'): return as-is
- If attack board ('WQL', 'WKL', 'BQL', 'BKL'): look up active instance ID

**Critical for:** Rendering pieces on attack boards

#### `src/utils/debugLogger.ts`
**Purpose:** Debug logging for coordinates  
**Key Function:** `logWorldCoordinates(world)` - Outputs all board and square positions

### Configuration Files

#### `src/config/theme.ts`
**Purpose:** Visual theme configuration  
**Exports:** `THEME` object with:
- `squares` - Colors, sizes, opacity
- `platforms` - Board platform colors
- `pieces` - Piece colors, material properties
- `lighting` - Ambient and directional light settings
- `camera` - Default position and FOV
- `cameraPresets` - Named camera positions
- `scene` - Background colors

### Persistence Files

#### `src/persistence/GamePersistence.ts`
**Purpose:** Abstract persistence interface

#### `src/persistence/localStoragePersistence.ts`
**Purpose:** LocalStorage implementation  
**Methods:** `saveGame()`, `loadGame()`, `deleteGame()`, `exportGame()`, `importGame()`

#### `src/persistence/schema.ts`
**Purpose:** Zod schemas for validation  
**Exports:** `SCHEMA_VERSION`, game state schemas

---

## Key Functions Reference

This section provides detailed reference for the most important functions.

### World Creation Functions

#### `createChessWorld(): ChessWorld`
**File:** `src/engine/world/worldBuilder.ts`  
**Called:** Once at initialization  
**Returns:** Complete ChessWorld with 27 boards and 100+ squares  
**Side effects:** None (pure function)  
**Time complexity:** O(n) where n = number of squares (~150)

**Implementation:**
```typescript
export function createChessWorld(): ChessWorld {
  const boards = new Map<string, BoardLayout>();
  const squares = new Map<string, WorldSquare>();
  const pins = new Map(Object.entries(PIN_POSITIONS));
  const adjacencyGraph = PIN_ADJACENCY;
  
  // Create 3 main boards
  const mainWhite = createMainBoard('WL', 'W', [1,2,3,4], [1,2,3,4], Z_WHITE_MAIN);
  const mainNeutral = createMainBoard('NL', 'N', [1,2,3,4], [3,4,5,6], Z_NEUTRAL_MAIN);
  const mainBlack = createMainBoard('BL', 'B', [1,2,3,4], [5,6,7,8], Z_BLACK_MAIN);
  
  boards.set('WL', mainWhite.board);
  boards.set('NL', mainNeutral.board);
  boards.set('BL', mainBlack.board);
  
  mainWhite.squares.forEach(sq => squares.set(sq.id, sq));
  mainNeutral.squares.forEach(sq => squares.set(sq.id, sq));
  mainBlack.squares.forEach(sq => squares.set(sq.id, sq));
  
  // Create 24 attack board instances (2 tracks × 6 pins × 2 rotations)
  for (const track of ['QL', 'KL']) {
    for (let pin = 1; pin <= 6; pin++) {
      for (const rotation of [0, 180]) {
        const instance = createAttackBoardInstance(track, pin, rotation);
        boards.set(instance.board.id, instance.board);
        instance.squares.forEach(sq => squares.set(sq.id, sq));
      }
    }
  }
  
  return { boards, squares, pins, adjacencyGraph };
}
```

#### `fileToWorldX(file: number): number`
**File:** `src/engine/world/coordinates.ts`  
**Purpose:** Converts file (0-5) to Three.js X coordinate  
**Called by:** `createChessWorld()` only  
**Formula:** `file * BOARD_SPACING` where `BOARD_SPACING = 2.1`

**Examples:**
- file 0 (z) → 0.0
- file 1 (a) → 2.1
- file 2 (b) → 4.2
- file 3 (c) → 6.3
- file 4 (d) → 8.4
- file 5 (e) → 10.5

#### `rankToWorldY(rank: number): number`
**File:** `src/engine/world/coordinates.ts`  
**Purpose:** Converts rank (0-9) to Three.js Y coordinate  
**Called by:** `createChessWorld()` only  
**Formula:** `rank * BOARD_SPACING`

**Examples:**
- rank 0 → 0.0
- rank 1 → 2.1
- rank 9 → 18.9

### Visibility Management Functions

#### `updateInstanceVisibility(world: ChessWorld, trackStates: TrackStates): void`
**File:** `src/engine/world/visibility.ts`  
**Purpose:** Updates which attack board instances are visible  
**Called:** After every attack board activation  
**Side effects:** Mutates `board.isVisible` and `board.isAccessible` flags  
**Time complexity:** O(n) where n = number of boards (27)

**Algorithm:**
1. Hide all attack board instances
2. Show White QL instance based on `trackStates.QL.whiteBoardPin` and `trackStates.QL.whiteRotation`
3. Show White KL instance
4. Show Black QL instance
5. Show Black KL instance

### Attack Board Functions

#### `validateActivation(context: ActivationContext): BoardMoveValidation`
**File:** `src/engine/world/worldMutation.ts`  
**Purpose:** Validates attack board activation  
**Returns:** `{ isValid: boolean, reason?: string }`  
**Time complexity:** O(p) where p = number of pieces

**Validation checks (in order):**
1. **Rotation check** - Can only rotate with ≤1 piece
2. **Adjacency check** - Destination must be adjacent to source
3. **Direction check** - Can't move backward if occupied (forward = increasing pin for White, decreasing for Black)
4. **Occupancy check** - Destination not occupied by another board
5. **Vertical shadow check** - No pieces blocking at same file/rank
6. **King safety check** - Move doesn't expose king (TODO)

#### `executeActivation(context: ActivationContext): ActivationResult`
**File:** `src/engine/world/worldMutation.ts`  
**Purpose:** Executes attack board activation and remaps pieces  
**Returns:** `{ updatedPieces, updatedPositions, activeInstanceId }`  
**Time complexity:** O(p) where p = number of pieces

**Algorithm:**
1. Calculate file and rank offsets based on pin positions
2. Identify passenger pieces
3. Remap each passenger:
   - If identity mapping: add offsets
   - If rot180 mapping: invert relative position then add offsets
4. Set `movedByAB = true` for pawn passengers
5. Update board position record
6. Calculate new activeInstanceId

#### `getArrivalOptions(...): Array<{ choice, file, rank }>`
**File:** `src/engine/world/coordinatesTransform.ts`  
**Purpose:** Calculates two arrival options for passenger  
**Returns:** Array with 2 elements (identity and rot180 mappings)  
**Parameters:**
- `track: 'QL' | 'KL'`
- `fromPin: number`
- `toPin: number`
- `fromRotation: 0 | 180`
- `toRotation: 0 | 180`
- `localFile: number` (0 or 1, relative to attack board)
- `localRank: number` (0 or 1)

### Move Validation Functions

#### `getLegalMoves(piece: Piece, world: ChessWorld, pieces: Piece[]): string[]`
**File:** `src/engine/validation/moveValidator.ts`  
**Purpose:** Returns all legal moves for a piece (ignoring check)  
**Returns:** Array of square IDs  
**Time complexity:** O(s × v) where s = squares, v = validation complexity

**Algorithm:**
1. Get piece's current square
2. Iterate all squares in world
3. For each square, call `validateMoveForPiece()`
4. If valid, add square ID to results
5. Return results

#### `getLegalMovesAvoidingCheck(piece: Piece, world: ChessWorld, pieces: Piece[]): string[]`
**File:** `src/engine/validation/checkDetection.ts`  
**Purpose:** Returns legal moves that don't leave king in check  
**Returns:** Array of square IDs  
**Time complexity:** O(s × v × c) where c = check detection complexity

**Algorithm:**
1. Get all legal moves (ignoring check)
2. For each move:
   - Simulate the move
   - Check if player's king is in check
   - If not in check, include in results
3. Return results

#### `isInCheck(color: 'white'|'black', world: ChessWorld, pieces: Piece[]): boolean`
**File:** `src/engine/validation/checkDetection.ts`  
**Purpose:** Determines if a color is in check  
**Time complexity:** O(p × s) where p = opponent pieces, s = squares

**Algorithm:**
1. Find king of specified color
2. Get king's square
3. For each opponent piece:
   - Get legal moves for that piece
   - If king's square is in legal moves, return true
4. Return false

### Rendering Functions

#### `resolveBoardId(level: string, attackBoardStates?: AttackBoardStates): string`
**File:** `src/utils/resolveBoardId.ts`  
**Purpose:** Maps piece.level to active instance ID  
**Returns:** Board ID or instance ID  
**Critical for:** Rendering pieces on attack boards

**Logic:**
- If level is 'W', 'N', or 'B': return unchanged (main board)
- If level is 'WQL', 'WKL', 'BQL', or 'BKL': look up active instance ID from attackBoardStates
- Return instance ID like 'QL1:0'

**Example:**
```typescript
// Piece on White's attack board (Queen's Line)
piece.level = 'WQL';
attackBoardStates.WQL.activeInstanceId = 'QL3:180';
resolveBoardId('WQL', attackBoardStates); // Returns 'QL3:180'

// Piece on main board
piece.level = 'W';
resolveBoardId('W', attackBoardStates); // Returns 'W'
```

### State Management Functions

#### `selectSquare(squareId: string): void`
**File:** `src/store/gameStore.ts`  
**Purpose:** Handles square selection (piece or destination)  
**Side effects:** Updates store state

**Logic:**
1. If nothing selected:
   - Find piece at square
   - If piece belongs to current player, select it and highlight valid moves
2. If square already selected:
   - If clicked square is a valid move destination, execute move
   - If clicked square has current player's piece, select that piece instead
   - Otherwise, deselect

#### `movePiece(piece: Piece, toFile: number, toRank: number, toLevel: string): void`
**File:** `src/store/gameStore.ts`  
**Purpose:** Executes a piece move  
**Side effects:** Updates pieces, captures, checks game state, switches turn

**Logic:**
1. Find and remove captured piece (if any)
2. Update moving piece's position and set `hasMoved = true`
3. Add move to history
4. Switch turn
5. Check for check, checkmate, stalemate
6. Update game state

#### `moveAttackBoard(boardId: string, toPinId: string, rotate?: boolean, arrivalChoice?: ArrivalChoice): void`
**File:** `src/store/gameStore.ts`  
**Purpose:** Executes attack board activation  
**Side effects:** Updates pieces, board positions, track states, visibility

**Logic:**
1. Get current position from `attackBoardPositions`
2. Validate activation
3. Execute activation (remap pieces)
4. Update `attackBoardPositions` and `attackBoardStates`
5. Update `trackStates` with new pin and rotation
6. Call `updateInstanceVisibility()`
7. Clear selection

---

## Attack Board Movement System

The attack board system is complex but follows a clear pattern.

### Validation (worldMutation.ts)

```typescript
export function validateActivation(context: ActivationContext): BoardMoveValidation {
  // 1. Rotation check - can only rotate with ≤1 piece
  if (rotate && passengerCount > 1) return { isValid: false, reason: '...' };
  
  // 2. Adjacency check - destination must be adjacent
  if (!adjacentPins.includes(toPinId)) return { isValid: false, reason: '...' };
  
  // 3. Direction check - can't move backward if occupied
  const direction = classifyDirection(fromPinId, toPinId, controller);
  if (direction === 'backward' && isOccupied) return { isValid: false, reason: '...' };
  
  // 4. Occupancy check - destination not occupied by other board
  if (destinationOccupied) return { isValid: false, reason: '...' };
  
  // 5. Vertical shadow check - no blocking pieces
  // ... checks each destination square for vertical shadows
  
  return { isValid: true };
}
```

### Execution (worldMutation.ts)

```typescript
export function executeActivation(context: ActivationContext): ActivationResult {
  const fromPin = PIN_POSITIONS[context.fromPinId];
  const toPin = PIN_POSITIONS[context.toPinId];
  
  // Calculate offsets
  const fileOffset = toPin.fileOffset - fromPin.fileOffset;
  const rankOffset = (toPin.rankOffset - fromPin.rankOffset) / 2;
  
  // Remap passengers
  const updatedPieces = context.pieces.map(piece => {
    if (!isPassenger(piece)) return piece;
    
    let newFile = piece.file + fileOffset;
    let newRank = piece.rank + rankOffset;
    
    // Apply rotation if chosen
    if (context.arrivalChoice === 'rot180') {
      // Invert relative position
      const localFile = piece.file - fromPin.fileOffset;
      const localRank = piece.rank - fromPin.rankOffset / 2;
      newFile = toPin.fileOffset + (1 - localFile);
      newRank = toPin.rankOffset / 2 + (1 - localRank);
    }
    
    return { ...piece, file: newFile, rank: newRank, movedByAB: piece.type === 'pawn' };
  });
  
  return {
    updatedPieces,
    updatedPositions: { ...positions, [boardId]: toPinId },
    activeInstanceId: makeInstanceId(track, pinNum, rotation),
  };
}
```

---

## Common Patterns

### Pattern: Reading Square Coordinates

**CORRECT:**
```typescript
const square = world.squares.get(squareId);
const worldX = square.worldX;
const worldY = square.worldY;
const worldZ = square.worldZ;
```

**INCORRECT:**
```typescript
const worldX = fileToWorldX(file); // ❌ NEVER in components
```

### Pattern: Building Square IDs

```typescript
import { fileToString } from './coordinates';

// Format: {file}{rank}{boardId}
const squareId = `${fileToString(piece.file)}${piece.rank}${boardId}`;
// Example: 'a2W', 'z1QL1:0', 'e9KL6:180'
```

### Pattern: Resolving Attack Board Instances

```typescript
const boardId = resolveBoardId(piece.level, attackBoardStates);
// piece.level = 'WQL' → boardId = 'QL1:0' (or whatever pin White's QL board is at)
// piece.level = 'W' → boardId = 'W' (main boards pass through unchanged)
```

---

## Testing Strategy

### Unit Tests

Location: `src/engine/world/__tests__/`, `src/engine/validation/__tests__/`

**Critical tests:**
- `coordinateValidation.test.ts` - **MUST PASS** before proceeding
- `worldBuilder.test.ts` - Tests world creation
- `visibility.test.ts` - Tests visibility toggle
- `activation.test.ts` - Tests attack board movement
- `checkDetection.test.ts` - Tests check/checkmate/stalemate

Run: `npm test`

### Visual Validation

Enable `WorldGridVisualizer` in `Board3D.tsx` to see:
- All boards with labels
- Coordinate values
- Rank continuity verification

This is a **Phase 3 requirement** - must be visually verified before game logic.

---

## Troubleshooting Guide

### Issue: Piece Not Rendering

**Cause:** Square not found in world.squares

**Debug:**
```typescript
const boardId = resolveBoardId(piece.level, attackBoardStates);
console.log('Board ID:', boardId);

const squareId = `${fileToString(piece.file)}${piece.rank}${boardId}`;
console.log('Square ID:', squareId);

const square = world.squares.get(squareId);
console.log('Square found:', !!square);
```

**Solution:** Ensure `attackBoardStates` has correct `activeInstanceId` for the board.

### Issue: Attack Board Won't Move

**Cause:** Validation failure

**Debug:**
```typescript
const validation = validateActivation(context);
console.log('Validation result:', validation);

const adjacentPins = getAdjacentPins(fromPinId);
console.log('Adjacent pins:', adjacentPins);
console.log('Is destination adjacent?', adjacentPins.includes(toPinId));
```

**Common causes:**
- Destination not adjacent
- Moving backward while occupied  
- Vertical shadow blocking
- Destination occupied by another board

### Issue: Coordinates Wrong

**Cause:** Component calculating positions instead of reading from world

**Solution:** Always read from `WorldSquare.worldX/Y/Z`. Never call `fileToWorldX()` or `rankToWorldY()` in components.

---

## Summary

This codebase is built on a **pre-computed coordinate system** using the **World Grid architecture**. The most critical concept to understand is that ALL coordinates are calculated ONCE at initialization by `createChessWorld()` and stored in a `ChessWorld` object that components read from.

### The Three Pillars

1. **World Grid System** (`src/engine/world/`) - Pre-computed coordinates for all 27 board instances (3 main + 24 attack)
2. **Visibility-Toggle Architecture** - Attack boards don't move; we toggle visibility between pre-created instances
3. **Track-Based State Management** - `trackStates` tracks which pin each board occupies on QL/KL tracks

### The Golden Rules

1. **Never calculate coordinates in components** - Always read from `WorldSquare.worldX/Y/Z`
2. **Never call fileToWorldX() or rankToWorldY() outside worldBuilder.ts** - These are initialization-only functions
3. **Always use resolveBoardId()** - To map piece.level (like 'WQL') to active instance ID (like 'QL1:0')
4. **Always validate coordinates** - Phase 3 tests must pass before proceeding with game logic

### Critical Entry Points

- **Initialization:** `main.tsx` → `useGameStore` → `createChessWorld()`
- **Piece Movement:** `selectSquare()` → `getLegalMovesAvoidingCheck()` → `movePiece()`
- **Attack Board Activation:** `selectBoard()` → `setArrivalSelection()` → `moveAttackBoard()` → `executeActivation()`
- **Rendering:** `Board3D` → `BoardRenderer` + `Pieces3D` (both read from ChessWorld)

### Most Important Files

1. **`src/engine/world/worldBuilder.ts`** - Creates the entire coordinate system (THE FOUNDATION)
2. **`src/engine/world/types.ts`** - Core interfaces (WorldSquare, BoardLayout, ChessWorld)
3. **`src/store/gameStore.ts`** - Runtime state and actions
4. **`src/engine/world/worldMutation.ts`** - Attack board movement logic
5. **`src/components/Board3D/BoardRenderer.tsx`** - Board rendering
6. **`src/components/Board3D/Pieces3D.tsx`** - Piece rendering
7. **`src/utils/resolveBoardId.ts`** - Maps piece level to instance ID

### Common Tasks

**Add a new feature:**
1. Read this document to understand architecture
2. Check if coordinate system needs changes (unlikely)
3. Add validation logic in `src/engine/validation/`
4. Add UI components in `src/components/UI/`
5. Test thoroughly

**Debug coordinate issues:**
1. Enable `WorldGridVisualizer` in `Board3D.tsx`
2. Run `logWorldCoordinates(world)` in console
3. Verify square IDs match expectations
4. Check `resolveBoardId()` mapping

**Modify attack board behavior:**
1. Review `src/engine/world/worldMutation.ts`
2. Update validation functions
3. Update execution functions
4. Test with all pin positions

For detailed information on any system, refer to the specific sections above or consult `reference_docs/NEW_WORLD_STRUCTURE.md` for the authoritative implementation requirements.

