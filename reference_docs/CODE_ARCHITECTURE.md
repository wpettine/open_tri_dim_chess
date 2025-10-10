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

