# New World Structure: Visibility-Based Attack Boards

**Author:** Devin AI  
**Date:** October 9, 2025  
**Purpose:** Design document for transitioning from 3D-movement attack boards to visibility-toggling attack boards

## Table of Contents
1. [Overview](#overview)
2. [Current System Analysis](#current-system-analysis)
3. [Proposed System Design](#proposed-system-design)
4. [World Structure Changes](#world-structure-changes)
5. [Rotation Handling](#rotation-handling)
6. [Graphics Rendering Changes](#graphics-rendering-changes)
7. [Logic & Validation Changes](#logic--validation-changes)
8. [Test Migration Strategy](#test-migration-strategy)
9. [Implementation Phases](#implementation-phases)
10. [Edge Cases & Considerations](#edge-cases--considerations)

---

## Overview

### Current Approach
Attack boards physically move in 3D space. When a board "moves" from one pin to another:
- The board's 3D coordinates (centerX, centerY, centerZ) are updated
- Square positions are recalculated and updated in the world
- Passenger pieces have their coordinates updated to match the new board position

### New Approach
Pre-create attack board instances at all 12 pin locations during world initialization. When a player "moves" an attack board:
- Current board instance becomes **invisible** and its spaces become **inaccessible**
- Target board instance becomes **visible** and its spaces become **accessible**
- Pieces are remapped to the corresponding squares on the new board instance
- The system tracks which board instance is "active" for each attack board type

### Benefits
- **Simpler rendering**: No 3D transformations needed, just show/hide
- **Clearer state management**: Active/inactive rather than position updates
- **Easier rotation handling**: Pre-calculated board instances for both orientations
- **Better performance**: No coordinate recalculation, just state flags

---

## Current System Analysis

### Current World Structure
```typescript
interface ChessWorld {
  boards: Map<string, BoardLayout>;     // 7 boards: WL, NL, BL, WQL, WKL, BQL, BKL
  squares: Map<string, WorldSquare>;    // All squares on all boards
  pins: Map<string, PinPosition>;       // 12 pin positions
}

interface BoardLayout {
  id: string;                   // e.g., "WQL"
  type: 'main' | 'attack';
  centerX: number;              // 3D position - CHANGES on move
  centerY: number;              // 3D position - CHANGES on move
  centerZ: number;              // 3D position - CHANGES on move
  size: { width: number; height: number };
  rotation: number;             // 0 or 180
  files: number[];              // CHANGES on move
  ranks: number[];              // CHANGES on move
}
```

### Current Movement Flow
1. **Validation** (`validateBoardMove`): Check adjacency, occupancy, vertical shadow, king safety
2. **Execution** (`executeBoardMove`): Update piece coordinates, update attackBoardPositions record
3. **World Update** (`updateAttackBoardWorld`): Physically move board by updating centerX/Y/Z and square positions
4. **Rendering**: BoardRenderer reads updated 3D coordinates and displays board at new location

### Current Rotation Flow
1. Validate rotation (≤1 piece on board)
2. Execute board move with `rotate: true`
3. Transform passenger piece coordinates using quadrant swap:
   - `newFile = toPin.fileOffset + (1 - relativeFile)`
   - `newRank = toPin.rankOffset + (1 - relativeRank)`
4. Update board rotation angle in BoardLayout
5. Renderer applies rotation transform

---

## Proposed System Design

### Core Concept: Board Instances
Instead of one board per attack board type, create **multiple instances** at each valid pin location:

- **WQL**: 6 instances (QL1, QL2, QL3, QL4, QL5, QL6) × 2 orientations (0°, 180°) = 12 instances
- **WKL**: 6 instances (KL1, KL2, KL3, KL4, KL5, KL6) × 2 orientations = 12 instances
- **BQL**: 6 instances (QL1-QL6) × 2 orientations = 12 instances
- **BKL**: 6 instances (KL1-KL6) × 2 orientations = 12 instances

**Total: 48 board instances** (vs current 4)

### Instance Naming Convention
```
{BoardType}@{PinId}[:{Rotation}]

Examples:
- "WQL@QL1:0"     // White Queen Line board at QL1, 0° rotation
- "WQL@QL1:180"   // White Queen Line board at QL1, 180° rotation
- "WQL@QL3:0"     // White Queen Line board at QL3, 0° rotation
- "BKL@KL6:180"   // Black King Line board at KL6, 180° rotation
```

### State Tracking
```typescript
interface AttackBoardState {
  boardType: 'WQL' | 'WKL' | 'BQL' | 'BKL';
  activeInstanceId: string;        // e.g., "WQL@QL1:0"
  currentPin: string;               // e.g., "QL1"
  currentRotation: 0 | 180;
  visible: boolean;                 // Is this board currently visible?
}

// Game state would track:
attackBoardStates: {
  WQL: AttackBoardState,
  WKL: AttackBoardState,
  BQL: AttackBoardState,
  BKL: AttackBoardState,
}
```

### Accessibility Tracking
Each board instance needs to track whether its squares are accessible:

```typescript
interface BoardInstance extends BoardLayout {
  instanceId: string;               // e.g., "WQL@QL1:0"
  baseId: string;                   // e.g., "WQL"
  pinId: string;                    // e.g., "QL1"
  rotation: 0 | 180;
  isVisible: boolean;               // Rendering flag
  isAccessible: boolean;            // Move validation flag
  // ... other BoardLayout properties
}
```

---

## World Structure Changes

### New World Interface
```typescript
interface ChessWorld {
  boards: Map<string, BoardInstance>;           // ~51 boards (3 main + 48 attack instances)
  squares: Map<string, WorldSquare>;            // All squares on all board instances
  pins: Map<string, PinPosition>;               // 12 pin positions (unchanged)
  boardInstances: Map<string, string[]>;        // Maps base ID to instance IDs
                                                // e.g., "WQL" → ["WQL@QL1:0", "WQL@QL1:180", ...]
}
```

### Square ID Changes
Squares need to be uniquely identified across all instances:

**Current:** `{file}-{rank}-{boardId}`  
Example: `1-0-WQL` (file 1, rank 0, on WQL board)

**Proposed:** `{file}-{rank}-{instanceId}`  
Example: `1-0-WQL@QL1:0` (file 1, rank 0, on WQL board at QL1 with 0° rotation)

### World Builder Changes

```typescript
// NEW: Create all attack board instances during initialization
export function createChessWorld(): ChessWorld {
  const boards = new Map<string, BoardInstance>();
  const squares = new Map<string, WorldSquare>();
  const pins = new Map(Object.entries(PIN_POSITIONS));
  const boardInstances = new Map<string, string[]>();

  // Create 3 main boards (unchanged)
  const mainWhite = createMainBoard('WL', ...);
  const mainNeutral = createMainBoard('NL', ...);
  const mainBlack = createMainBoard('BL', ...);
  
  boards.set('WL', mainWhite.board);
  boards.set('NL', mainNeutral.board);
  boards.set('BL', mainBlack.board);
  
  // Add main board squares
  mainWhite.squares.forEach((sq) => squares.set(sq.id, sq));
  mainNeutral.squares.forEach((sq) => squares.set(sq.id, sq));
  mainBlack.squares.forEach((sq) => squares.set(sq.id, sq));

  // NEW: Create all attack board instances
  const attackBoards = ['WQL', 'WKL', 'BQL', 'BKL'];
  const rotations = [0, 180];
  
  for (const boardType of attackBoards) {
    const instanceIds: string[] = [];
    const pinList = getPinsForBoardType(boardType); // QL1-6 or KL1-6
    
    for (const pinId of pinList) {
      for (const rotation of rotations) {
        const instanceId = `${boardType}@${pinId}:${rotation}`;
        const instance = createAttackBoardInstance(
          boardType,
          instanceId,
          pinId,
          rotation
        );
        
        boards.set(instanceId, instance.board);
        instance.squares.forEach((sq) => squares.set(sq.id, sq));
        instanceIds.push(instanceId);
      }
    }
    
    boardInstances.set(boardType, instanceIds);
  }

  return { boards, squares, pins, boardInstances };
}

function getPinsForBoardType(boardType: string): string[] {
  const isQueenLine = boardType.includes('QL');
  return isQueenLine 
    ? ['QL1', 'QL2', 'QL3', 'QL4', 'QL5', 'QL6']
    : ['KL1', 'KL2', 'KL3', 'KL4', 'KL5', 'KL6'];
}

function createAttackBoardInstance(
  baseId: string,
  instanceId: string,
  pinId: string,
  rotation: 0 | 180
): { board: BoardInstance; squares: WorldSquare[] } {
  const pin = PIN_POSITIONS[pinId];
  const isQueenLine = pinId.startsWith('QL');
  const baseFile = isQueenLine ? 0 : 4;
  
  // Calculate files and ranks based on rotation
  let files: number[];
  let ranks: number[];
  
  if (rotation === 0) {
    files = [baseFile, baseFile + 1];
    ranks = [pin.rankOffset, pin.rankOffset + 1];
  } else {
    // For 180° rotation, quadrants are swapped
    files = [baseFile + 1, baseFile];      // Reversed
    ranks = [pin.rankOffset + 1, pin.rankOffset];  // Reversed
  }
  
  const centerX = (fileToWorldX(files[0]) + fileToWorldX(files[1])) / 2;
  const centerY = (rankToWorldY(ranks[0]) + rankToWorldY(ranks[1])) / 2;
  const centerZ = pin.zHeight;
  
  // Determine initial visibility (only initial positions are visible)
  const initialPins = getInitialPinPositions(); // { WQL: 'QL1', WKL: 'KL1', ... }
  const isInitialPosition = initialPins[baseId] === pinId && rotation === 0;
  
  const board: BoardInstance = {
    id: instanceId,
    instanceId,
    baseId,
    pinId,
    type: 'attack',
    centerX,
    centerY,
    centerZ,
    size: { width: 2, height: 2 },
    rotation,
    files,
    ranks,
    isVisible: isInitialPosition,
    isAccessible: isInitialPosition,
  };
  
  // Create squares for this instance
  const squares: WorldSquare[] = [];
  for (const file of files) {
    for (const rank of ranks) {
      const worldX = fileToWorldX(file);
      const worldY = rankToWorldY(rank);
      const worldZ = pin.zHeight;
      const color = (file + rank) % 2 === 0 ? 'dark' : 'light';
      const squareId = createSquareId(file, rank, instanceId);
      
      squares.push({
        id: squareId,
        boardId: instanceId,
        file,
        rank,
        worldX,
        worldY,
        worldZ,
        color,
      });
    }
  }
  
  return { board, squares };
}
```

### Initial Game State
```typescript
// In gameStore.ts initialization
attackBoardStates: {
  WQL: {
    boardType: 'WQL',
    activeInstanceId: 'WQL@QL1:0',
    currentPin: 'QL1',
    currentRotation: 0,
    visible: true,
  },
  WKL: {
    boardType: 'WKL',
    activeInstanceId: 'WKL@KL1:0',
    currentPin: 'KL1',
    currentRotation: 0,
    visible: true,
  },
  BQL: {
    boardType: 'BQL',
    activeInstanceId: 'BQL@QL6:0',
    currentPin: 'QL6',
    currentRotation: 0,
    visible: true,
  },
  BKL: {
    boardType: 'BKL',
    activeInstanceId: 'BKL@KL6:0',
    currentPin: 'KL6',
    currentRotation: 0,
    visible: true,
  },
}
```

---

## Rotation Handling

### Challenge: Coordinate Mapping Between Rotations
When rotating a board, pieces need to map to the rotated instance's squares. The key insight is that rotation swaps quadrants:

**0° Board Squares:**
```
q1(0,0) | q2(1,0)
--------|--------
q3(0,1) | q4(1,1)
```

**180° Board Squares (quadrants swapped):**
```
q4(1,1) | q3(0,1)
--------|--------
q2(1,0) | q1(0,0)
```

### Rotation Coordinate Transformation
When switching from `WQL@QL3:0` to `WQL@QL3:180`:

**Pin-relative coordinates (relative to pin's base file/rank):**
- A piece at relative position (0,0) on 0° board → (1,1) on 180° board
- A piece at relative position (1,0) on 0° board → (0,1) on 180° board
- A piece at relative position (0,1) on 0° board → (1,0) on 180° board
- A piece at relative position (1,1) on 0° board → (0,0) on 180° board

**Formula:**
```typescript
function rotateCoordinates(
  piece: Piece,
  fromInstance: BoardInstance,
  toInstance: BoardInstance
): { file: number; rank: number } {
  // Get piece position relative to source board
  const relativeFile = piece.file - fromInstance.files[0];
  const relativeRank = piece.rank - fromInstance.ranks[0];
  
  // Apply 180° rotation transformation
  const rotatedRelativeFile = 1 - relativeFile;
  const rotatedRelativeRank = 1 - relativeRank;
  
  // Convert back to absolute coordinates on target board
  const newFile = toInstance.files[0] + rotatedRelativeFile;
  const newRank = toInstance.ranks[0] + rotatedRelativeRank;
  
  return { file: newFile, rank: newRank };
}
```

### Movement Between Pins (No Rotation)
When moving from one pin to another without rotation (e.g., `WQL@QL1:0` → `WQL@QL3:0`):

Pieces maintain their **relative position** on the board:
```typescript
function translateCoordinates(
  piece: Piece,
  fromInstance: BoardInstance,
  toInstance: BoardInstance
): { file: number; rank: number } {
  // Get piece position relative to source board
  const relativeFile = piece.file - fromInstance.files[0];
  const relativeRank = piece.rank - fromInstance.ranks[0];
  
  // Apply to target board (same relative position)
  const newFile = toInstance.files[0] + relativeFile;
  const newRank = toInstance.ranks[0] + relativeRank;
  
  return { file: newFile, rank: newRank };
}
```

### Combined Movement + Rotation
When moving AND rotating (e.g., `WQL@QL1:0` → `WQL@QL3:180`):
1. First translate to the new pin (maintaining relative position)
2. Then apply rotation transformation

OR equivalently:
1. First apply rotation at current pin
2. Then translate to new pin

Both approaches yield the same result due to the independence of translation and rotation.

### Piece Level Tracking
**Current:** Pieces track `level` as the base board ID (e.g., `"WQL"`)

**Proposed Options:**

**Option A - Track Instance ID:**
```typescript
interface Piece {
  // ... other properties
  level: string;  // "WQL@QL1:0" (full instance ID)
}
```
- Pro: Direct reference to exact board instance
- Con: Requires updating piece.level on every board move/rotation

**Option B - Track Base ID + Lookup (RECOMMENDED):**
```typescript
interface Piece {
  // ... other properties
  level: string;  // "WQL" (base board ID)
}

// Piece's actual instance determined by:
// attackBoardStates[piece.level].activeInstanceId
```
- Pro: Piece level unchanged during board moves
- Pro: Single source of truth (attackBoardStates)
- Con: Need lookup to get instance ID

**Recommendation: Option B** - Keep piece.level as base ID, use attackBoardStates to resolve active instance.

---

## Graphics Rendering Changes

### Current Rendering Approach
```typescript
// BoardRenderer.tsx - Current
{Array.from(world.boards.values()).map(board => (
  <SingleBoard key={board.id} board={board} />
))}

// SingleBoard component renders board at board.centerX, board.centerY, board.centerZ
// with rotation applied via: rotation={[0, 0, (board.rotation * Math.PI) / 180]}
```

### New Rendering Approach
```typescript
// BoardRenderer.tsx - New
{Array.from(world.boards.values())
  .filter(board => board.type === 'main' || board.isVisible)  // Only render visible boards
  .map(board => (
    <SingleBoard key={board.instanceId} board={board} />
  ))}

// SingleBoard component:
// - Main boards: Always render (unchanged)
// - Attack boards: Only render if isVisible === true
// - No rotation transform needed (already baked into instance)
```

### Board Selection Visual
When a board is selected for movement:
```typescript
// In SingleBoard component
const isSelected = selectedBoardId === board.baseId;  // Match base ID, not instance ID
const isEligibleDestination = /* check if this instance is a valid move target */;

// Render with appropriate highlighting:
<mesh>
  <meshStandardMaterial 
    color={
      isSelected ? THEME.squares.selectedColor :
      isEligibleDestination ? THEME.squares.availableMoveColor :
      THEME.attackBoardSelector.color
    }
    opacity={board.isVisible ? 1.0 : 0.3}  // Dim invisible boards for debugging
  />
</mesh>
```

### Pin Visualization
Pin markers should show:
1. **Eligible destinations** when a board is selected
2. **Currently occupied** pins with distinct styling

```typescript
// Show pins on main boards
{board.type === 'main' && renderPinMarkers(board)}

function renderPinMarkers(mainBoard: BoardLayout) {
  const pinsOnThisLevel = getPinsForLevel(mainBoard.id);
  
  return pinsOnThisLevel.map(pin => {
    const isOccupied = /* check if any active instance is at this pin */;
    const isEligible = /* check if selected board can move here */;
    
    return (
      <mesh
        key={pin.id}
        position={[pin.worldX, pin.worldY, mainBoard.centerZ]}
        onClick={() => handlePinClick(pin)}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
        <meshStandardMaterial
          color={
            isEligible ? THEME.pinMarker.eligible :
            isOccupied ? THEME.pinMarker.occupied :
            THEME.pinMarker.default
          }
        />
      </mesh>
    );
  });
}
```

---

## Logic & Validation Changes

### Move Validation Updates

#### Current Validation Flow
```typescript
canMoveBoard(boardId: string, toPinId: string) {
  const fromPinId = state.attackBoardPositions[boardId];
  validateBoardMove({ boardId, fromPinId, toPinId, ... });
}
```

#### New Validation Flow
```typescript
canMoveBoard(boardId: string, toPinId: string, rotation: 0 | 180 = 0) {
  const state = attackBoardStates[boardId];
  const fromInstanceId = state.activeInstanceId;
  const toInstanceId = `${boardId}@${toPinId}:${rotation}`;
  
  // Validate using instance IDs
  return validateBoardMove({ 
    fromInstanceId, 
    toInstanceId,
    pieces,
    world,
    attackBoardStates,
  });
}
```

### Board Movement Execution

#### Current Execution
```typescript
moveAttackBoard(boardId: string, toPinId: string, rotate = false) {
  // 1. Validate move
  // 2. Execute move (update piece coordinates)
  // 3. Update attackBoardPositions
  // 4. Call updateAttackBoardWorld() to physically move board
}
```

#### New Execution
```typescript
moveAttackBoard(
  boardId: string, 
  toPinId: string, 
  rotation: 0 | 180 = 0
) {
  const state = attackBoardStates[boardId];
  const fromInstance = world.boards.get(state.activeInstanceId);
  const toInstanceId = `${boardId}@${toPinId}:${rotation}`;
  const toInstance = world.boards.get(toInstanceId);
  
  // 1. Validate move
  const validation = validateBoardMove({ fromInstance, toInstance, ... });
  if (!validation.isValid) return;
  
  // 2. Update piece coordinates
  const passengers = getPassengerPieces(fromInstance, pieces);
  const updatedPieces = pieces.map(piece => {
    if (!passengers.includes(piece)) return piece;
    
    // Determine if rotation is involved
    const didRotate = fromInstance.rotation !== toInstance.rotation;
    
    let newCoords;
    if (didRotate) {
      newCoords = rotateCoordinates(piece, fromInstance, toInstance);
    } else {
      newCoords = translateCoordinates(piece, fromInstance, toInstance);
    }
    
    return {
      ...piece,
      file: newCoords.file,
      rank: newCoords.rank,
      hasMoved: true,
    };
  });
  
  // 3. Toggle visibility/accessibility
  fromInstance.isVisible = false;
  fromInstance.isAccessible = false;
  toInstance.isVisible = true;
  toInstance.isAccessible = true;
  
  // 4. Update board state
  attackBoardStates[boardId] = {
    ...state,
    activeInstanceId: toInstanceId,
    currentPin: toPinId,
    currentRotation: rotation,
  };
  
  // 5. Update game state
  set({
    pieces: updatedPieces,
    attackBoardStates: { ...attackBoardStates },
    currentTurn: nextTurn,
    moveHistory: [...moveHistory, newMove],
  });
}
```

### Rotation-Only Execution
```typescript
rotateAttackBoard(boardId: string, rotation: 0 | 180) {
  const state = attackBoardStates[boardId];
  const currentPin = state.currentPin;
  
  // This is just a special case of moveAttackBoard
  moveAttackBoard(boardId, currentPin, rotation);
}
```

### Vertical Shadow Validation
Update to check against accessible instances:

```typescript
function validateVerticalShadow(context: BoardMoveContext): BoardMoveValidation {
  const toInstance = world.boards.get(context.toInstanceId);
  const destinationSquares = toInstance.squares;
  
  for (const square of destinationSquares) {
    const blockingPiece = pieces.find(p => {
      if (p.file !== square.file || p.rank !== square.rank) return false;
      if (p.type === 'knight') return false;
      
      // Get the piece's current instance
      const pieceInstance = getPieceInstance(p);
      if (pieceInstance.instanceId === toInstance.instanceId) return false;
      
      // Check if piece is at different Z height
      return pieceInstance.centerZ !== toInstance.centerZ;
    });
    
    if (blockingPiece) {
      return { 
        isValid: false, 
        reason: `Vertical shadow: ${blockingPiece.type} blocks board placement` 
      };
    }
  }
  
  return { isValid: true };
}

function getPieceInstance(piece: Piece): BoardInstance {
  if (piece.level === 'W' || piece.level === 'N' || piece.level === 'B') {
    // Main board piece
    return world.boards.get(piece.level + 'L');
  } else {
    // Attack board piece
    const state = attackBoardStates[piece.level];
    return world.boards.get(state.activeInstanceId);
  }
}
```

### Accessibility Checks
When determining legal moves for pieces, only consider accessible squares:

```typescript
function getLegalMovesForPiece(piece: Piece, world: ChessWorld): string[] {
  const moves: string[] = [];
  
  // Get all potentially reachable squares
  const candidateSquares = getCandidateSquares(piece);
  
  for (const square of candidateSquares) {
    const boardInstance = world.boards.get(square.boardId);
    
    // Skip squares on inaccessible board instances
    if (boardInstance.type === 'attack' && !boardInstance.isAccessible) {
      continue;
    }
    
    // ... rest of move validation
    if (isValidMove(piece, square)) {
      moves.push(square.id);
    }
  }
  
  return moves;
}
```

---

## Test Migration Strategy

### Current Test Structure
Tests in `boardMovement.test.ts` validate:
- Adjacency rules
- Occupancy constraints
- Vertical shadow blocking
- Rotation constraints
- Backward movement restrictions
- Passenger piece coordinate updates

### Test Updates Required

#### 1. Update Test Setup
```typescript
// OLD
const basePositions = {
  WQL: 'QL1',
  WKL: 'KL1',
  BQL: 'QL6',
  BKL: 'KL6',
};

// NEW
const baseStates = {
  WQL: {
    boardType: 'WQL',
    activeInstanceId: 'WQL@QL1:0',
    currentPin: 'QL1',
    currentRotation: 0,
    visible: true,
  },
  // ... similar for WKL, BQL, BKL
};
```

#### 2. Update Validation Context
```typescript
// OLD
const context: BoardMoveContext = {
  boardId: 'WQL',
  fromPinId: 'QL1',
  toPinId: 'QL2',
  rotate: false,
  pieces: basePieces,
  world: mockWorld,
  attackBoardPositions: basePositions,
};

// NEW
const context: BoardMoveContext = {
  fromInstanceId: 'WQL@QL1:0',
  toInstanceId: 'WQL@QL2:0',
  pieces: basePieces,
  world: mockWorld,
  attackBoardStates: baseStates,
};
```

#### 3. Update Coordinate Assertions
```typescript
// OLD - Test that piece coordinates updated
it('should update passenger coordinates when moving board', () => {
  const passenger: Piece = { /* ... */ file: 0, rank: 0, level: 'WQL' };
  const result = executeBoardMove(context);
  
  const updatedPassenger = result.updatedPieces.find(p => p.id === passenger.id);
  expect(updatedPassenger.file).toBe(0);  // Same relative position
  expect(updatedPassenger.rank).toBe(4);  // New pin's rank offset
});

// NEW - Test that piece coordinates updated AND verify instance accessibility
it('should update passenger coordinates and toggle instance visibility', () => {
  const fromInstance = mockWorld.boards.get('WQL@QL1:0');
  const toInstance = mockWorld.boards.get('WQL@QL2:0');
  const passenger: Piece = { /* ... */ file: 0, rank: 0, level: 'WQL' };
  
  const result = executeBoardMove(context);
  
  // Verify piece coordinates
  const updatedPassenger = result.updatedPieces.find(p => p.id === passenger.id);
  expect(updatedPassenger.file).toBe(0);
  expect(updatedPassenger.rank).toBe(4);
  
  // Verify instance states
  expect(fromInstance.isVisible).toBe(false);
  expect(fromInstance.isAccessible).toBe(false);
  expect(toInstance.isVisible).toBe(true);
  expect(toInstance.isAccessible).toBe(true);
});
```

#### 4. Add Rotation Transformation Tests
```typescript
describe('Rotation Coordinate Mapping', () => {
  it('should correctly map piece coordinates when rotating 180°', () => {
    const fromInstance = mockWorld.boards.get('WQL@QL3:0');
    const toInstance = mockWorld.boards.get('WQL@QL3:180');
    
    const passenger: Piece = {
      id: 'test-piece',
      type: 'pawn',
      color: 'white',
      file: 0,        // Bottom-left on 0° board
      rank: 2,
      level: 'WQL',
      hasMoved: false,
    };
    
    const context = {
      fromInstanceId: 'WQL@QL3:0',
      toInstanceId: 'WQL@QL3:180',
      pieces: [passenger],
      // ...
    };
    
    const result = executeBoardMove(context);
    const updated = result.updatedPieces[0];
    
    // Bottom-left (0,2) on 0° → top-right (1,3) on 180°
    expect(updated.file).toBe(1);
    expect(updated.rank).toBe(3);
  });
  
  it('should correctly map all quadrants during rotation', () => {
    // Test all 4 quadrants map correctly
    const testCases = [
      { from: {file: 0, rank: 2}, to: {file: 1, rank: 3} },  // q1 → q4
      { from: {file: 1, rank: 2}, to: {file: 0, rank: 3} },  // q2 → q3
      { from: {file: 0, rank: 3}, to: {file: 1, rank: 2} },  // q3 → q2
      { from: {file: 1, rank: 3}, to: {file: 0, rank: 2} },  // q4 → q1
    ];
    
    for (const testCase of testCases) {
      const passenger: Piece = { /* ... */ ...testCase.from, level: 'WQL' };
      const result = executeBoardMove({ /* ... */ pieces: [passenger] });
      const updated = result.updatedPieces[0];
      
      expect(updated.file).toBe(testCase.to.file);
      expect(updated.rank).toBe(testCase.to.rank);
    }
  });
});
```

#### 5. Add Instance Visibility Tests
```typescript
describe('Board Instance Visibility', () => {
  it('should have only initial instances visible at game start', () => {
    const world = createChessWorld();
    
    const visibleInstances = Array.from(world.boards.values())
      .filter(b => b.type === 'attack' && b.isVisible);
    
    expect(visibleInstances).toHaveLength(4);
    expect(visibleInstances.map(b => b.instanceId)).toEqual([
      'WQL@QL1:0',
      'WKL@KL1:0',
      'BQL@QL6:0',
      'BKL@KL6:0',
    ]);
  });
  
  it('should toggle visibility when moving board', () => {
    // Move WQL from QL1 to QL2
    const context = {
      fromInstanceId: 'WQL@QL1:0',
      toInstanceId: 'WQL@QL2:0',
      // ...
    };
    
    executeBoardMove(context);
    
    const fromInstance = world.boards.get('WQL@QL1:0');
    const toInstance = world.boards.get('WQL@QL2:0');
    
    expect(fromInstance.isVisible).toBe(false);
    expect(toInstance.isVisible).toBe(true);
  });
});
```

### Test Migration Checklist
- [ ] Update world builder tests to verify 48 attack board instances created
- [ ] Update adjacency tests to use instance IDs
- [ ] Update occupancy tests to check instance accessibility
- [ ] Update vertical shadow tests with instance-aware lookups
- [ ] Update rotation tests to verify coordinate transformations
- [ ] Update passenger piece tests for both translation and rotation
- [ ] Add new tests for visibility toggling
- [ ] Add new tests for accessibility checks
- [ ] Update backward movement tests
- [ ] Update king safety tests (if affected)

---

## Implementation Phases

### Phase 1: Data Structure Foundation
**Goal:** Set up new data structures without breaking existing functionality

1. **Add new types** to `types.ts`:
   - `BoardInstance` interface
   - `AttackBoardState` interface
   - Update `ChessWorld` interface

2. **Create instance generation logic** in `worldBuilder.ts`:
   - `createAttackBoardInstance()` function
   - Update `createChessWorld()` to generate all 48 instances
   - Initially set all instances to `isVisible: false, isAccessible: false`
   - Set only initial instances to visible/accessible

3. **Verify** with tests:
   - Test world has 51 total boards (3 main + 48 attack)
   - Test each board type has 12 instances (6 pins × 2 rotations)
   - Test instance naming convention correct
   - Test initial visibility states correct

### Phase 2: Game State Integration
**Goal:** Update game state to track board instances

1. **Update `gameStore.ts`**:
   - Add `attackBoardStates` to GameState
   - Remove or deprecate `attackBoardPositions` (keep temporarily for migration)
   - Initialize `attackBoardStates` correctly

2. **Add state conversion utilities**:
   - `getActiveInstance(boardId: string): BoardInstance`
   - `setActiveInstance(boardId: string, instanceId: string): void`

3. **Update persistence**:
   - Add `attackBoardStates` to save/load
   - Ensure backward compatibility for old saves

4. **Verify** with tests:
   - Test state initialization
   - Test save/load functionality
   - Test state queries work correctly

### Phase 3: Movement Logic Migration
**Goal:** Update movement and validation logic to use instances

1. **Update `worldMutation.ts`**:
   - Modify `validateBoardMove()` to accept instance IDs
   - Modify `executeBoardMove()` to toggle visibility/accessibility
   - Implement `translateCoordinates()` helper
   - Implement `rotateCoordinates()` helper
   - Update `getPassengerPieces()` to work with instances

2. **Update `gameStore.ts` actions**:
   - Modify `moveAttackBoard()` to use new execution flow
   - Modify `rotateAttackBoard()` to use new execution flow
   - Modify `canMoveBoard()` to use instance-based validation
   - Update `getValidMovesForSquare()` to respect accessibility

3. **Verify** with tests:
   - Update all movement tests from migration strategy
   - Test coordinate transformations
   - Test visibility toggling
   - Test accessibility constraints

### Phase 4: Rendering Updates
**Goal:** Update 3D rendering to show/hide instances

1. **Update `BoardRenderer.tsx`**:
   - Filter boards by visibility for rendering
   - Update selection highlighting
   - Update pin marker rendering

2. **Update visual feedback**:
   - Show selected board highlight on base board
   - Show eligible destination pins
   - Optionally: dim invisible instances for debugging

3. **Verify** manually:
   - Test board selection visual
   - Test move eligibility highlighting
   - Test board movement animation (if desired)
   - Test rotation visual

### Phase 5: Cleanup & Optimization
**Goal:** Remove old code and optimize

1. **Remove deprecated code**:
   - Remove `updateAttackBoardWorld()` function
   - Remove `attackBoardPositions` from state (if fully migrated)
   - Clean up old validation logic

2. **Optimize rendering**:
   - Consider instance pooling if performance issues
   - Optimize square lookups

3. **Final testing**:
   - Full game playthrough
   - All edge cases
   - Performance testing

---

## Edge Cases & Considerations

### 1. Multiple Pieces on Board
**Current behavior:** Cannot rotate with >1 piece on board

**New approach:** 
- When moving an instance, ALL passenger pieces move together
- Coordinate transformation applies to all passengers
- Validation same as before (rotation restricted to ≤1 piece)

### 2. Piece on Inaccessible Square
**Scenario:** A piece somehow ends up on an inaccessible instance

**Solution:**
- Should be impossible if logic is correct
- Add defensive check: pieces must always be on accessible instances
- If detected, trigger error and auto-correct

### 3. Visual Debugging
**During development:**
- Optionally render ALL instances with varying opacity
- Highlight accessible instances in green
- Show current active instances with full opacity

**Production:**
- Only render visible instances
- Or render all but with very low opacity for debugging

### 4. Save/Load Compatibility
**Challenge:** Old saves have `attackBoardPositions`, new system has `attackBoardStates`

**Solution:**
```typescript
function migrateOldSave(payload: any): GameSnapshot {
  if (payload.attackBoardPositions && !payload.attackBoardStates) {
    // Old format - convert
    payload.attackBoardStates = {};
    
    for (const [boardId, pinId] of Object.entries(payload.attackBoardPositions)) {
      payload.attackBoardStates[boardId] = {
        boardType: boardId,
        activeInstanceId: `${boardId}@${pinId}:0`,
        currentPin: pinId,
        currentRotation: 0,
        visible: true,
      };
    }
  }
  
  return payload;
}
```

### 5. Performance Considerations
**Concern:** 48 board instances might impact performance

**Mitigations:**
- Only render visible instances (4 max at any time)
- Instance squares already pre-calculated (no runtime computation)
- Use React memoization for board components
- Consider WebGL instancing for identical geometries

### 6. Animation Transitions
**Current:** Board physically moves in 3D space (could animate)

**New approach options:**

**Option A - No animation:**
- Instant toggle (simple, fast)
- Piece teleports to new position

**Option B - Fade transition:**
- Fade out current instance
- Fade in target instance
- Smooth but no spatial movement

**Option C - Hybrid:**
- Keep one "ghost" board that animates
- Swap visibility at end of animation
- Best visual continuity

**Recommendation:** Start with Option A (no animation), add Option B if desired later.

### 7. Testing Strategy
**Unit tests:** Test coordinate transformations, validation logic, state management

**Integration tests:** Test full move sequences, rotation combos, edge cases

**Manual tests:** Visual verification, gameplay testing, edge case scenarios

---

## Summary

### Key Changes
1. **World Structure:** 48 attack board instances (6 pins × 2 rotations × 4 board types)
2. **State Management:** Track active instance per board type via `attackBoardStates`
3. **Movement:** Toggle visibility/accessibility instead of moving in 3D
4. **Rotation:** Pre-calculated instances; coordinate transformation via formulas
5. **Rendering:** Filter by visibility; no 3D transforms needed
6. **Validation:** Instance-aware checks; accessibility constraints

### Benefits
- Simpler rendering (show/hide vs. 3D movement)
- Clearer state (active/inactive instances)
- Easier rotation (pre-calculated positions)
- Better separation of concerns

### Migration Path
1. Phase 1: Data structures
2. Phase 2: State integration
3. Phase 3: Logic migration
4. Phase 4: Rendering
5. Phase 5: Cleanup

### Risks & Mitigations
- **Complexity:** More instances to manage
  - *Mitigation:* Clear naming convention, helper functions
- **Performance:** 48 instances vs. 4
  - *Mitigation:* Only render visible (4 max), pre-compute positions
- **Save compatibility:** Old saves won't work
  - *Mitigation:* Migration function for old format

---

## Open Questions

1. **Animation preferences:** Instant swap, fade, or hybrid approach?
2. **Debug visualization:** Show all instances during development?
3. **Backward compatibility:** Support old saves indefinitely or deprecate?
4. **Performance targets:** Any specific FPS or render time requirements?
5. **Visual polish:** Special effects for board movement/rotation?

---

**Document Status:** Draft for Review  
**Next Steps:** Review with team, gather feedback, begin Phase 1 implementation
