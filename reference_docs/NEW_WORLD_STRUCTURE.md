# New World Structure: Visibility-Based Attack Boards (Revised Meder System)

**Author:** Devin AI  
**Date:** October 9, 2025  
**Last Updated:** October 9, 2025  
**Purpose:** Implementation plan for revised Meder coordinate system using visibility-toggling attack boards

## Table of Contents
1. [Overview](#overview)
2. [Revised Meder Coordinate System Summary](#revised-meder-coordinate-system-summary)
3. [Current System Analysis](#current-system-analysis)
4. [Proposed System Design](#proposed-system-design)
5. [World Structure Changes](#world-structure-changes)
6. [Track State & Ownership](#track-state--ownership)
7. [Activation & Movement Logic](#activation--movement-logic)
8. [Two-Square Arrival Mapping](#two-square-arrival-mapping)
9. [Castling Implementation](#castling-implementation)
10. [Pawn Promotion Implementation](#pawn-promotion-implementation)
11. [Graphics Rendering Changes](#graphics-rendering-changes)
12. [Test Strategy](#test-strategy)
13. [Implementation Phases](#implementation-phases)
14. [Edge Cases & Considerations](#edge-cases--considerations)

---

## Overview

### Fundamental Design Principle
This implementation uses **visibility-toggling** to simulate attack board movement. Rather than moving 3D objects in space, we pre-create all possible attack board positions and toggle their visibility on/off to represent board activation.

### Key Concepts from Revised Meder System

**Physical Model:**
- **12 fixed pin positions**: 6 on Queen's Line (QL1-QL6), 6 on King's Line (KL1-KL6)
- **4 physical attack boards**: White QL, White KL, Black QL, Black KL
- **Each board moves between pins on its track** (QL boards move between QL pins, KL boards between KL pins)
- **Cross-track adjacency**: QL and KL pins at same index are adjacent (e.g., QL3 ↔ KL3)

**Ownership Model:**
- Pins have **dynamic ownership** based on which board occupies them
- At any moment, a pin is owned by: White's board, Black's board, or is vacant
- **Controller** of occupied board = passenger's color (if occupied), board's inherent color (if empty)

**Movement Rules:**
- **Empty boards**: Can move forward, backward, or sideways to any adjacent pin
- **Occupied boards**: Can only move forward or sideways (backward prohibited)
- **Forward direction**: White = increasing pin number, Black = decreasing pin number
- **Adjacency graph**: Defines legal transitions (QL2↔QL3, QL3↔KL3, etc.)

**Transport Mechanism:**
- When board activates, passenger piece has **two arrival options**:
  1. **Identity mapping**: Same local (x,y) position on destination board
  2. **180° rotation mapping**: Rotated (1-x, 1-y) position on destination board
- Player chooses which option when moving
- Special flag `movedByAB` tracks pieces transported via activation

### Implementation Strategy

**Pre-Creation Approach:**
- Create 12 pin positions × 2 rotation variants = **24 board instances per track**
- Total: 24 QL instances + 24 KL instances = **48 attack board instances**
- But only **4 boards visible at once** (one per player per track)

**Visibility-Toggle Mechanism:**
When White's QL board moves from QL1 → QL3:
1. Hide instance at QL1 (both 0° and 180° variants)
2. Show chosen instance at QL3 (0° OR 180° based on player choice)
3. Remap passenger pieces to corresponding squares on new instance
4. Update track state to reflect new pin position

**Benefits:**
- **No 3D movement**: Boards never move; we just toggle visibility
- **Pre-calculated coordinates**: All positions known at initialization
- **Clean state management**: Track state shows which instance is active
- **Efficient rendering**: Only render 4 visible instances out of 48 total
- **Simplified rotation**: Rotation is just choosing which instance variant to show

---

## Revised Meder Coordinate System Summary

This section summarizes key aspects of the revised Meder system that drive implementation decisions.

### Coordinate Schema
- **Main boards**: W (ranks 1-4), N (ranks 3-6), B (ranks 5-8)
- **Files**: z, a, b, c, d, e (6 files total)
- **Attack board files**: QL = z/a (left side), KL = d/e (right side)
- **Pin positions** with fixed rank pairs:
  - QL1/KL1: ranks 0-1
  - QL2/KL2: ranks 4-5
  - QL3/KL3: ranks 2-3
  - QL4/KL4: ranks 6-7
  - QL5/KL5: ranks 4-5 (overlaps with 2)
  - QL6/KL6: ranks 8-9

### Pin Adjacency Graph
Each pin connects to:
- Adjacent pins on same track (QL1↔QL2, QL2↔QL3, etc.)
- Corresponding pin on opposite track (QL2↔KL2)
- Diagonally adjacent pins across tracks (QL2↔KL3, QL3↔KL2)

**Neighbor counts:**
- Pins 1 & 6: 3 neighbors each
- Pins 2 & 5: 4 neighbors each
- Pins 3 & 4: 5 neighbors each

### Ownership & Control
```typescript
// At runtime, for each track:
interface TrackState {
  whiteBoardPin: number;     // Which pin White's board occupies (1-6)
  blackBoardPin: number;     // Which pin Black's board occupies (1-6)
  passengerWhite?: Piece | null;
  passengerBlack?: Piece | null;
}

// Pin ownership is computed dynamically:
function getOwner(track: 'QL' | 'KL', pin: number): 'white' | 'black' | null {
  if (trackState[track].whiteBoardPin === pin) return 'white';
  if (trackState[track].blackBoardPin === pin) return 'black';
  return null;
}

// Controller (for occupied boards):
function getController(board: AttackBoard): 'white' | 'black' {
  if (board.passenger) return board.passenger.color;
  return board.inherentColor;
}
```

### Initial Setup
- White QL board: QL1
- White KL board: KL1
- Black QL board: QL6
- Black KL board: KL6

### Special Rules to Implement

**Castling on Attack Boards:**
- **Kingside**: King and rook swap positions on same board (KL1 or QL1)
- **Queenside**: King and rook cross between QL1↔KL1 (White) or QL6↔KL6 (Black) on back rank bridge
- Requires both boards controlled by player, no activation this turn, standard castling rules

**Pawn Promotion:**
- **Dynamic furthest rank** depends on file and attack board presence:
  - Files b/c: Fixed at rank 1 (White) / 8 (Black)
  - Files z/e: Always rank 0 (White) / 9 (Black)
  - Files a/d: Rank 0/9 if attack board overhangs corner, else 1/8
- **Deferred promotion**: If corner blocked by attack board, promotion deferred until board moves
- **Missing promotion plane**: If rank 0/9 doesn't exist (board moved away), pawn can't advance to it

**Pawn Flags:**
- `movedByAB`: Set when pawn transported via activation
- Disables: double-step advance, en passant capture eligibility

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

### What Needs to Change

**Key Issues with Current System:**
1. **Board identity confusion**: `WQL` could be at any pin, but we have 4 boards competing for same IDs
2. **No ownership tracking**: Can't determine which player owns which pin
3. **No cross-track adjacency**: QL and KL boards can't interact
4. **No arrival choice**: Passenger always lands at same relative position (no rotation option)
5. **Missing special rules**: No castling on attack boards, no dynamic pawn promotion, no `movedByAB` flag

**Revised System Requirements:**
1. **Track-based organization**: Replace 4 board IDs (WQL/WKL/BQL/BKL) with 2 tracks (QL/KL) each having White/Black boards
2. **Pin ownership**: Track which player's board occupies each pin on each track
3. **Adjacency graph**: Implement full pin neighbor relationships including cross-track
4. **Two-square arrival**: Player chooses identity or rotated landing when activating
5. **Special features**: Castling, dynamic promotion, pawn transport flags

---

## Proposed System Design

### Core Concept: Pre-Created Pin Instances with Visibility Toggle

Instead of moving boards in 3D space, we pre-create board instances at all 12 pin positions (each with 2 rotation variants) and toggle visibility to simulate movement.

**Instance Organization:**
- **Per track**: 6 pins × 2 rotations = 12 instances per track
- **Two tracks**: QL (12 instances) + KL (12 instances) = 24 total instances
- **Visible at once**: 4 instances maximum (White QL, White KL, Black QL, Black KL)

### Instance Naming Convention

**Format:** `{Track}{PinNumber}:{Rotation}`

```
Examples:
- "QL1:0"     // Queen's Line pin 1, 0° rotation
- "QL1:180"   // Queen's Line pin 1, 180° rotation  
- "QL3:0"     // Queen's Line pin 3, 0° rotation
- "KL6:180"   // King's Line pin 6, 180° rotation
```

**Rationale:** Since we're now modeling the physical reality (boards move between pins on a track), we name instances by their fixed position, not by which player's board might occupy them.

### State Tracking

The game state tracks **which pin each player's board occupies** on each track:

```typescript
interface TrackState {
  track: 'QL' | 'KL';
  whiteBoardPin: number;          // 1-6: which pin White's board occupies
  blackBoardPin: number;          // 1-6: which pin Black's board occupies  
  whiteRotation: 0 | 180;         // White board's current rotation
  blackRotation: 0 | 180;         // Black board's current rotation
  whitePassenger: Piece | null;   // Piece on White's board (max 1)
  blackPassenger: Piece | null;   // Piece on Black's board (max 1)
}

// Game state tracks both tracks:
interface GameState {
  // ... existing state ...
  trackStates: {
    QL: TrackState;
    KL: TrackState;
  };
  
  // Derived: which instances are currently visible
  visibleInstances: Set<string>;  // e.g., ["QL1:0", "KL1:0", "QL6:0", "KL6:0"]
}
```

### Board Instance Structure

Each pre-created instance knows its position and rotation, but doesn't track ownership (that's in TrackState):

```typescript
interface BoardInstance {
  instanceId: string;              // e.g., "QL3:180"
  track: 'QL' | 'KL';              // Which track this is on
  pin: number;                     // 1-6: which pin position
  rotation: 0 | 180;               // Baked-in rotation
  type: 'attack';
  
  // Spatial properties (pre-calculated, never change)
  centerX: number;
  centerY: number;
  centerZ: number;
  files: number[];                 // e.g., [0, 1] for QL, [4, 5] for KL
  ranks: number[];                 // Depends on pin position
  size: { width: 2; height: 2 };
  
  // Rendering properties (updated by game state)
  isVisible: boolean;              // Set by TrackState logic
  isAccessible: boolean;           // Same as isVisible for attack boards
}
```

### Visibility Determination Logic

```typescript
function updateInstanceVisibility(world: ChessWorld, trackStates: TrackStates) {
  // Hide all attack board instances
  world.boards.forEach(board => {
    if (board.type === 'attack') {
      board.isVisible = false;
      board.isAccessible = false;
    }
  });
  
  // Show only the 4 active instances
  for (const track of ['QL', 'KL'] as const) {
    const state = trackStates[track];
    
    // White's board instance
    const whiteInstanceId = `${track}${state.whiteBoardPin}:${state.whiteRotation}`;
    const whiteInstance = world.boards.get(whiteInstanceId);
    if (whiteInstance) {
      whiteInstance.isVisible = true;
      whiteInstance.isAccessible = true;
    }
    
    // Black's board instance
    const blackInstanceId = `${track}${state.blackBoardPin}:${state.blackRotation}`;
    const blackInstance = world.boards.get(blackInstanceId);
    if (blackInstance) {
      blackInstance.isVisible = true;
      blackInstance.isAccessible = true;
    }
  }
}
```

### Pin Ownership Computation

```typescript
function getPinOwner(
  track: 'QL' | 'KL', 
  pin: number, 
  trackState: TrackState
): 'white' | 'black' | null {
  if (trackState.whiteBoardPin === pin) return 'white';
  if (trackState.blackBoardPin === pin) return 'black';
  return null;
}

function getBoardController(
  track: 'QL' | 'KL',
  color: 'white' | 'black',
  trackState: TrackState
): 'white' | 'black' {
  const passenger = color === 'white' 
    ? trackState.whitePassenger 
    : trackState.blackPassenger;
  
  // If board has passenger, controller is passenger's color
  if (passenger) return passenger.color;
  
  // Otherwise, controller is board's inherent color
  return color;
}
```

---

## World Structure Changes

### New World Interface
```typescript
interface ChessWorld {
  boards: Map<string, BoardInstance>;        // 3 main + 24 attack instances = 27 total
  squares: Map<string, WorldSquare>;         // All squares on all board instances
  pins: Map<string, PinPosition>;            // 12 pin positions (unchanged)
  adjacencyGraph: PinAdjacencyGraph;         // Pin neighbor relationships
}

interface PinAdjacencyGraph {
  QL: Record<number, PinNeighbor[]>;  // QL pin adjacencies
  KL: Record<number, PinNeighbor[]>;  // KL pin adjacencies
}

interface PinNeighbor {
  track: 'QL' | 'KL';
  pin: number;
}
```

### Square ID Changes
Squares need to be uniquely identified across all instances:

**Current:** `{file}-{rank}-{boardId}`  
Example: `1-0-WQL` (file 1, rank 0, on WQL board)

**Proposed:** `{file}-{rank}-{instanceId}`  
Example: `0-1-QL1:0` (file 0 [='z'], rank 1, on QL pin 1 at 0° rotation)

**Piece Level Representation:**
```typescript
// Pieces on attack boards now use instance-based levels
interface Piece {
  // ... other properties
  level: string;  // "W", "N", "B" for main boards, or "QL1:0", "KL3:180" for attack boards
}
```

### World Builder Changes

```typescript
// Pin rank offsets from REVISED_MEDER_COORDINATE_SYSTEM.md
const PIN_RANK_OFFSETS: Record<number, number> = {
  1: 0,   // ranks 0-1
  2: 4,   // ranks 4-5
  3: 2,   // ranks 2-3
  4: 6,   // ranks 6-7
  5: 4,   // ranks 4-5 (overlaps with pin 2)
  6: 8,   // ranks 8-9
};

// Pin adjacency from REVISED_MEDER_COORDINATE_SYSTEM.md
const PIN_ADJACENCY: PinAdjacencyGraph = {
  QL: {
    1: [
      { track: 'QL', pin: 2 },
      { track: 'KL', pin: 1 },
      { track: 'KL', pin: 2 },
    ],
    2: [
      { track: 'QL', pin: 1 },
      { track: 'QL', pin: 3 },
      { track: 'KL', pin: 2 },
      { track: 'KL', pin: 3 },
    ],
    3: [
      { track: 'QL', pin: 2 },
      { track: 'QL', pin: 4 },
      { track: 'KL', pin: 2 },
      { track: 'KL', pin: 3 },
      { track: 'KL', pin: 4 },
    ],
    4: [
      { track: 'QL', pin: 3 },
      { track: 'QL', pin: 5 },
      { track: 'KL', pin: 3 },
      { track: 'KL', pin: 4 },
      { track: 'KL', pin: 5 },
    ],
    5: [
      { track: 'QL', pin: 4 },
      { track: 'QL', pin: 6 },
      { track: 'KL', pin: 4 },
      { track: 'KL', pin: 5 },
    ],
    6: [
      { track: 'QL', pin: 5 },
      { track: 'KL', pin: 5 },
      { track: 'KL', pin: 6 },
    ],
  },
  KL: {
    1: [
      { track: 'KL', pin: 2 },
      { track: 'QL', pin: 1 },
      { track: 'QL', pin: 2 },
    ],
    2: [
      { track: 'KL', pin: 1 },
      { track: 'KL', pin: 3 },
      { track: 'QL', pin: 2 },
      { track: 'QL', pin: 3 },
    ],
    3: [
      { track: 'KL', pin: 2 },
      { track: 'KL', pin: 4 },
      { track: 'QL', pin: 2 },
      { track: 'QL', pin: 3 },
      { track: 'QL', pin: 4 },
    ],
    4: [
      { track: 'KL', pin: 3 },
      { track: 'KL', pin: 5 },
      { track: 'QL', pin: 3 },
      { track: 'QL', pin: 4 },
      { track: 'QL', pin: 5 },
    ],
    5: [
      { track: 'KL', pin: 4 },
      { track: 'KL', pin: 6 },
      { track: 'QL', pin: 4 },
      { track: 'QL', pin: 5 },
    ],
    6: [
      { track: 'KL', pin: 5 },
      { track: 'QL', pin: 5 },
      { track: 'QL', pin: 6 },
    ],
  },
};

export function createChessWorld(): ChessWorld {
  const boards = new Map<string, BoardInstance>();
  const squares = new Map<string, WorldSquare>();
  const pins = new Map(Object.entries(PIN_POSITIONS));

  // Create 3 main boards (unchanged)
  const mainWhite = createMainBoard('W', ...);
  const mainNeutral = createMainBoard('N', ...);
  const mainBlack = createMainBoard('B', ...);
  
  boards.set('W', mainWhite.board);
  boards.set('N', mainNeutral.board);
  boards.set('B', mainBlack.board);
  
  // Add main board squares
  mainWhite.squares.forEach((sq) => squares.set(sq.id, sq));
  mainNeutral.squares.forEach((sq) => squares.set(sq.id, sq));
  mainBlack.squares.forEach((sq) => squares.set(sq.id, sq));

  // Create all attack board instances (24 total)
  const tracks = ['QL', 'KL'] as const;
  const rotations = [0, 180] as const;
  
  for (const track of tracks) {
    for (let pin = 1; pin <= 6; pin++) {
      for (const rotation of rotations) {
        const instance = createAttackBoardInstance(track, pin, rotation);
        boards.set(instance.board.instanceId, instance.board);
        instance.squares.forEach((sq) => squares.set(sq.id, sq));
      }
    }
  }

  return { 
    boards, 
    squares, 
    pins, 
    adjacencyGraph: PIN_ADJACENCY 
  };
}

function createAttackBoardInstance(
  track: 'QL' | 'KL',
  pin: number,
  rotation: 0 | 180
): { board: BoardInstance; squares: WorldSquare[] } {
  const instanceId = `${track}${pin}:${rotation}`;
  const rankOffset = PIN_RANK_OFFSETS[pin];
  
  // Determine file range based on track
  // QL = files z,a (indices 0,1), KL = files d,e (indices 4,5)
  const baseFile = track === 'QL' ? 0 : 4;
  
  // Calculate files and ranks based on rotation
  let files: number[];
  let ranks: number[];
  
  if (rotation === 0) {
    files = [baseFile, baseFile + 1];
    ranks = [rankOffset, rankOffset + 1];
  } else {
    // For 180° rotation, quadrants are swapped
    files = [baseFile + 1, baseFile];          // Reversed
    ranks = [rankOffset + 1, rankOffset];      // Reversed
  }
  
  const centerX = (fileToWorldX(files[0]) + fileToWorldX(files[1])) / 2;
  const centerY = (rankToWorldY(ranks[0]) + rankToWorldY(ranks[1])) / 2;
  const centerZ = getAttackBoardZHeight(track, pin);
  
  // All instances start invisible; visibility set by TrackState
  const board: BoardInstance = {
    instanceId,
    track,
    pin,
    type: 'attack',
    centerX,
    centerY,
    centerZ,
    size: { width: 2, height: 2 },
    rotation,
    files,
    ranks,
    isVisible: false,
    isAccessible: false,
  };
  
  // Create squares for this instance
  const squares: WorldSquare[] = [];
  for (const file of files) {
    for (const rank of ranks) {
      const worldX = fileToWorldX(file);
      const worldY = rankToWorldY(rank);
      const worldZ = centerZ;
      const color = (file + rank) % 2 === 0 ? 'dark' : 'light';
      const squareId = `${file}-${rank}-${instanceId}`;
      
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
const initialTrackStates: Record<'QL' | 'KL', TrackState> = {
  QL: {
    track: 'QL',
    whiteBoardPin: 1,       // White starts at QL1
    blackBoardPin: 6,       // Black starts at QL6
    whiteRotation: 0,       // Both start at 0° rotation
    blackRotation: 0,
    whitePassenger: null,   // No passengers initially
    blackPassenger: null,
  },
  KL: {
    track: 'KL',
    whiteBoardPin: 1,       // White starts at KL1
    blackBoardPin: 6,       // Black starts at KL6
    whiteRotation: 0,
    blackRotation: 0,
    whitePassenger: null,
    blackPassenger: null,
  },
};

// After initialization, update instance visibility
updateInstanceVisibility(world, initialTrackStates);
// This makes QL1:0, KL1:0, QL6:0, KL6:0 visible
```

---

## Track State & Ownership

### Track State Management

The game state maintains track state for both QL and KL, tracking which pins each player's board occupies:

```typescript
interface GameState {
  // ... existing properties ...
  trackStates: {
    QL: TrackState;
    KL: TrackState;
  };
}
```

### Ownership Queries

```typescript
// Get which player (if any) owns a specific pin
function getPinOwner(
  track: 'QL' | 'KL',
  pin: number,
  trackState: TrackState
): 'white' | 'black' | null {
  if (trackState.whiteBoardPin === pin) return 'white';
  if (trackState.blackBoardPin === pin) return 'black';
  return null;
}

// Get who controls a board (passenger color overrides board color)
function getBoardController(
  color: 'white' | 'black',
  trackState: TrackState
): 'white' | 'black' {
  const passenger = color === 'white' 
    ? trackState.whitePassenger 
    : trackState.blackPassenger;
  
  if (passenger) return passenger.color;
  return color;
}

// Check if a specific pin is occupied
function isPinOccupied(
  track: 'QL' | 'KL',
  pin: number,
  trackState: TrackState
): boolean {
  return trackState.whiteBoardPin === pin || trackState.blackBoardPin === pin;
}

// Get all vacant pins on a track
function getVacantPins(trackState: TrackState): number[] {
  const occupied = new Set([trackState.whiteBoardPin, trackState.blackBoardPin]);
  return [1, 2, 3, 4, 5, 6].filter(pin => !occupied.has(pin));
}
```

### Board State Updates

When a board moves, update the track state and refresh instance visibility:

```typescript
function updateBoardPosition(
  gameState: GameState,
  track: 'QL' | 'KL',
  color: 'white' | 'black',
  newPin: number,
  newRotation: 0 | 180
): void {
  const trackState = gameState.trackStates[track];
  
  // Update pin position and rotation
  if (color === 'white') {
    trackState.whiteBoardPin = newPin;
    trackState.whiteRotation = newRotation;
  } else {
    trackState.blackBoardPin = newPin;
    trackState.blackRotation = newRotation;
  }
  
  // Refresh visibility of all instances based on new state
  updateInstanceVisibility(gameState.world, gameState.trackStates);
}
```

---

## Activation & Movement Logic

### Activation Overview

"Activation" is the term for moving an attack board from one pin to another. Key rules:

1. **Adjacency**: Board can only move to adjacent pins (defined in adjacency graph)
2. **Occupancy**: Can't move to a pin already occupied by another board
3. **Direction restrictions**:
   - **Empty boards**: Can move forward, backward, or sideways
   - **Occupied boards**: Can only move forward or sideways (backward prohibited)
   - **Forward**: White = increasing pin numbers, Black = decreasing pin numbers
4. **Controller**: Only the board's controller can activate it
5. **King safety**: Activation cannot leave own king in check

### Validation Logic

```typescript
interface ActivationRequest {
  track: 'QL' | 'KL';
  color: 'white' | 'black';      // Which board (white's or black's)
  toPin: number;                  // Destination pin (1-6)
  rotation: 0 | 180;              // Desired rotation at destination
}

function validateActivation(
  request: ActivationRequest,
  gameState: GameState
): { valid: boolean; reason?: string } {
  const trackState = gameState.trackStates[request.track];
  const fromPin = request.color === 'white' 
    ? trackState.whiteBoardPin 
    : trackState.blackBoardPin;
  
  // 1. Check adjacency
  const neighbors = gameState.world.adjacencyGraph[request.track][fromPin];
  const isAdjacent = neighbors.some(
    n => n.track === request.track && n.pin === request.toPin
  );
  if (!isAdjacent) {
    return { valid: false, reason: 'Destination pin not adjacent' };
  }
  
  // 2. Check occupancy
  if (isPinOccupied(request.track, request.toPin, trackState)) {
    return { valid: false, reason: 'Destination pin already occupied' };
  }
  
  // 3. Check direction restrictions
  const passenger = request.color === 'white' 
    ? trackState.whitePassenger 
    : trackState.blackPassenger;
  
  if (passenger) {
    // Board is occupied - check direction
    const isForward = request.color === 'white' 
      ? request.toPin > fromPin 
      : request.toPin < fromPin;
    
    const isSideways = Math.abs(request.toPin - fromPin) === 0; // Cross-track
    
    if (!isForward && !isSideways) {
      return { valid: false, reason: 'Occupied boards cannot move backward' };
    }
  }
  
  // 4. Check controller
  const controller = getBoardController(request.color, trackState);
  if (controller !== gameState.currentTurn) {
    return { valid: false, reason: 'Not your board to move' };
  }
  
  // 5. Check king safety (after hypothetical move)
  const wouldExposeKing = checkKingSafetyAfterActivation(request, gameState);
  if (wouldExposeKing) {
    return { valid: false, reason: 'Would leave king in check' };
  }
  
  return { valid: true };
}
```

### Execution Logic

When activation is valid, we need to:
1. Update track state with new pin and rotation
2. Update piece coordinates (if there's a passenger)
3. Refresh instance visibility
4. Update piece level tracking
5. Set `movedByAB` flag on passenger

```typescript
function executeActivation(
  request: ActivationRequest,
  gameState: GameState,
  arrivalChoice: 'identity' | 'rotation'
): GameState {
  const trackState = gameState.trackStates[request.track];
  const fromPin = request.color === 'white' 
    ? trackState.whiteBoardPin 
    : trackState.blackBoardPin;
  
  const fromInstance = `${request.track}${fromPin}:${
    request.color === 'white' ? trackState.whiteRotation : trackState.blackRotation
  }`;
  const toInstance = `${request.track}${request.toPin}:${request.rotation}`;
  
  // 1. Get passenger (if any)
  const passenger = request.color === 'white'
    ? trackState.whitePassenger
    : trackState.blackPassenger;
  
  let updatedPieces = gameState.pieces;
  
  // 2. Update passenger coordinates
  if (passenger) {
    const fromBoard = gameState.world.boards.get(fromInstance);
    const toBoard = gameState.world.boards.get(toInstance);
    
    const newCoords = calculateArrivalCoordinates(
      passenger,
      fromBoard,
      toBoard,
      arrivalChoice
    );
    
    updatedPieces = gameState.pieces.map(p => {
      if (p.id === passenger.id) {
        return {
          ...p,
          file: newCoords.file,
          rank: newCoords.rank,
          level: toInstance,      // Update piece level to new instance
          hasMoved: true,
          movedByAB: true,        // Set transport flag
        };
      }
      return p;
    });
    
    // Update passenger reference
    if (request.color === 'white') {
      trackState.whitePassenger = updatedPieces.find(p => p.id === passenger.id);
    } else {
      trackState.blackPassenger = updatedPieces.find(p => p.id === passenger.id);
    }
  }
  
  // 3. Update track state
  if (request.color === 'white') {
    trackState.whiteBoardPin = request.toPin;
    trackState.whiteRotation = request.rotation;
  } else {
    trackState.blackBoardPin = request.toPin;
    trackState.blackRotation = request.rotation;
  }
  
  // 4. Refresh instance visibility
  updateInstanceVisibility(gameState.world, gameState.trackStates);
  
  // 5. Create new game state
  return {
    ...gameState,
    pieces: updatedPieces,
    trackStates: { ...gameState.trackStates },
    currentTurn: gameState.currentTurn === 'white' ? 'black' : 'white',
    moveHistory: [
      ...gameState.moveHistory,
      {
        type: 'activation',
        track: request.track,
        color: request.color,
        from: fromPin,
        to: request.toPin,
        rotation: request.rotation,
        arrivalChoice,
        passenger: passenger?.id,
      },
    ],
  };
}
```

### Direction Determination

```typescript
function getForwardDirection(color: 'white' | 'black'): 'increasing' | 'decreasing' {
  return color === 'white' ? 'increasing' : 'decreasing';
}

function isForwardMove(
  color: 'white' | 'black',
  fromPin: number,
  toPin: number,
  track: 'QL' | 'KL'
): boolean {
  if (fromPin === toPin) return false; // Same track, different destination = sideways
  
  const direction = getForwardDirection(color);
  return direction === 'increasing' ? toPin > fromPin : toPin < fromPin;
}

function isSidewaysMove(
  fromTrack: 'QL' | 'KL',
  toTrack: 'QL' | 'KL'
): boolean {
  return fromTrack !== toTrack;
}
```

### Passenger Management

```typescript
// Check if a piece is on an attack board
function getPieceBoard(
  piece: Piece,
  gameState: GameState
): { type: 'main' | 'attack'; track?: 'QL' | 'KL'; color?: 'white' | 'black' } {
  if (piece.level === 'W' || piece.level === 'N' || piece.level === 'B') {
    return { type: 'main' };
  }
  
  // Parse instance ID to determine which board
  const instanceMatch = piece.level.match(/^(QL|KL)(\d):(\d+)$/);
  if (!instanceMatch) throw new Error(`Invalid level: ${piece.level}`);
  
  const track = instanceMatch[1] as 'QL' | 'KL';
  const pin = parseInt(instanceMatch[2]);
  
  const trackState = gameState.trackStates[track];
  
  if (trackState.whiteBoardPin === pin) {
    return { type: 'attack', track, color: 'white' };
  } else if (trackState.blackBoardPin === pin) {
    return { type: 'attack', track, color: 'black' };
  }
  
  throw new Error(`Piece on attack board but pin not occupied: ${piece.level}`);
}

// Update passenger reference when piece moves onto/off of board
function updatePassengerTracking(
  gameState: GameState,
  piece: Piece
): void {
  const pieceBoard = getPieceBoard(piece, gameState);
  
  if (pieceBoard.type === 'attack') {
    const trackState = gameState.trackStates[pieceBoard.track!];
    
    if (pieceBoard.color === 'white') {
      trackState.whitePassenger = piece;
    } else {
      trackState.blackPassenger = piece;
    }
  }
}
```

---

## Two-Square Arrival Mapping

### Overview

When an attack board activates with a passenger, the passenger can choose between two landing options on the destination board:

1. **Identity mapping**: Piece maintains same local (x,y) position relative to board
2. **180° rotation mapping**: Piece lands at rotated (1-x, 1-y) position

This gives tactical flexibility - a piece can emerge from transport in different orientations.

### Coordinate Mapping Functions

```typescript
function calculateArrivalCoordinates(
  piece: Piece,
  fromBoard: BoardInstance,
  toBoard: BoardInstance,
  arrivalChoice: 'identity' | 'rotation'
): { file: number; rank: number } {
  // Get piece position relative to source board
  // Local coordinates are 0-1 for a 2x2 board
  const localX = piece.file - fromBoard.files[0];
  const localY = piece.rank - fromBoard.ranks[0];
  
  let targetLocalX: number;
  let targetLocalY: number;
  
  if (arrivalChoice === 'identity') {
    // Identity: same local position
    targetLocalX = localX;
    targetLocalY = localY;
  } else {
    // Rotation: 180° transformation
    targetLocalX = 1 - localX;
    targetLocalY = 1 - localY;
  }
  
  // Convert back to absolute coordinates on destination board
  const newFile = toBoard.files[0] + targetLocalX;
  const newRank = toBoard.ranks[0] + targetLocalY;
  
  return { file: newFile, rank: newRank };
}
```

### Mapping Examples

**Example 1: QL track, pin 2 → pin 5, identity**
- From board: QL2:0 (files z,a; ranks 4,5)
- To board: QL5:0 (files z,a; ranks 4,5)
- Piece at z4QL2 (local 0,0) → z4QL5 (local 0,0)
- Piece at a5QL2 (local 1,1) → a5QL5 (local 1,1)

**Example 2: QL track, pin 2 → pin 5, rotation**
- From board: QL2:0 (files z,a; ranks 4,5)
- To board: QL5:0 (files z,a; ranks 4,5)
- Piece at z4QL2 (local 0,0) → a5QL5 (local 1,1)
- Piece at a5QL2 (local 1,1) → z4QL5 (local 0,0)

**Example 3: KL track, pin 1 → pin 3, identity**
- From board: KL1:0 (files d,e; ranks 0,1)
- To board: KL3:0 (files d,e; ranks 2,3)
- Piece at d0KL1 (local 0,0) → d2KL3 (local 0,0)
- Piece at e1KL1 (local 1,1) → e3KL3 (local 1,1)

### UI Presentation

When player activates a board with a passenger, show both landing options:

```typescript
interface ArrivalOption {
  choice: 'identity' | 'rotation';
  squareId: string;
  coordinates: { file: number; rank: number };
  notation: string;  // e.g., "a5QL5" or "z4QL5"
}

function getArrivalOptions(
  activation: ActivationRequest,
  passenger: Piece,
  gameState: GameState
): ArrivalOption[] {
  const fromInstance = getCurrentInstance(activation.track, activation.color, gameState);
  const toInstance = `${activation.track}${activation.toPin}:${activation.rotation}`;
  
  const fromBoard = gameState.world.boards.get(fromInstance);
  const toBoard = gameState.world.boards.get(toInstance);
  
  const identityCoords = calculateArrivalCoordinates(passenger, fromBoard, toBoard, 'identity');
  const rotationCoords = calculateArrivalCoordinates(passenger, fromBoard, toBoard, 'rotation');
  
  return [
    {
      choice: 'identity',
      squareId: `${identityCoords.file}-${identityCoords.rank}-${toInstance}`,
      coordinates: identityCoords,
      notation: formatSquareNotation(identityCoords, toInstance),
    },
    {
      choice: 'rotation',
      squareId: `${rotationCoords.file}-${rotationCoords.rank}-${toInstance}`,
      coordinates: rotationCoords,
      notation: formatSquareNotation(rotationCoords, toInstance),
    },
  ];
}
```

### Validation of Arrival Squares

Both arrival squares must be:
1. On the destination board (already guaranteed by construction)
2. Either empty or contain an enemy piece (capture allowed)
3. Not create an illegal position (king in check, etc.)

```typescript
function validateArrivalSquares(
  options: ArrivalOption[],
  gameState: GameState
): ArrivalOption[] {
  return options.filter(option => {
    const square = gameState.world.squares.get(option.squareId);
    if (!square) return false;
    
    const occupyingPiece = gameState.pieces.find(
      p => p.file === option.coordinates.file && 
           p.rank === option.coordinates.rank &&
           p.level === square.boardId
    );
    
    // Empty square is valid
    if (!occupyingPiece) return true;
    
    // Can capture enemy piece
    if (occupyingPiece.color !== gameState.currentTurn) return true;
    
    // Cannot land on own piece
    return false;
  });
}
```

---

## Castling Implementation

### Castling Overview

Castling occurs **on attack boards only** in this variant, since kings and rooks start on attack boards. There are two types:

1. **Kingside castling**: King and rook swap on same board (KL or QL)
2. **Queenside castling**: King and rook cross between QL↔KL on back-rank bridge

### Kingside Castling

King and rook are on the same attack board and swap positions:

```typescript
interface KingsideCastleRequest {
  color: 'white' | 'black';
  track: 'QL' | 'KL';
}

function validateKingsideCastle(
  request: KingsideCastleRequest,
  gameState: GameState
): { valid: boolean; reason?: string } {
  const trackState = gameState.trackStates[request.track];
  const pin = request.color === 'white' ? trackState.whiteBoardPin : trackState.blackBoardPin;
  const rotation = request.color === 'white' ? trackState.whiteRotation : trackState.blackRotation;
  const instanceId = `${request.track}${pin}:${rotation}`;
  
  // 1. Find king and rook on this board
  const boardPieces = gameState.pieces.filter(p => p.level === instanceId);
  const king = boardPieces.find(p => p.type === 'king' && p.color === request.color);
  const rook = boardPieces.find(p => p.type === 'rook' && p.color === request.color);
  
  if (!king || !rook) {
    return { valid: false, reason: 'King or rook not on this board' };
  }
  
  // 2. Check neither has moved
  if (king.hasMoved || rook.hasMoved) {
    return { valid: false, reason: 'King or rook has already moved' };
  }
  
  // 3. Check board is controlled by player
  const controller = getBoardController(request.color, trackState);
  if (controller !== request.color) {
    return { valid: false, reason: 'Board not controlled by player' };
  }
  
  // 4. Check king not in check
  if (isInCheck(request.color, gameState)) {
    return { valid: false, reason: 'King is in check' };
  }
  
  // 5. Check path and destination squares not attacked
  const kingSquare = { file: king.file, rank: king.rank };
  const rookSquare = { file: rook.file, rank: rook.rank };
  
  if (isSquareAttacked(rookSquare, request.color, gameState)) {
    return { valid: false, reason: 'King destination square is attacked' };
  }
  
  if (isSquareAttacked(kingSquare, request.color, gameState)) {
    // King square already checked above, this is for destination
    return { valid: false, reason: 'Rook destination square is attacked' };
  }
  
  return { valid: true };
}

function executeKingsideCastle(
  request: KingsideCastleRequest,
  gameState: GameState
): GameState {
  const trackState = gameState.trackStates[request.track];
  const pin = request.color === 'white' ? trackState.whiteBoardPin : trackState.blackBoardPin;
  const rotation = request.color === 'white' ? trackState.whiteRotation : trackState.blackRotation;
  const instanceId = `${request.track}${pin}:${rotation}`;
  
  const updatedPieces = gameState.pieces.map(p => {
    if (p.level !== instanceId || p.color !== request.color) return p;
    
    if (p.type === 'king') {
      // Find rook position and swap
      const rook = gameState.pieces.find(
        piece => piece.level === instanceId && 
                 piece.color === request.color && 
                 piece.type === 'rook'
      );
      return { ...p, file: rook!.file, rank: rook!.rank, hasMoved: true };
    } else if (p.type === 'rook') {
      // Find king position and swap
      const king = gameState.pieces.find(
        piece => piece.level === instanceId && 
                 piece.color === request.color && 
                 piece.type === 'king'
      );
      return { ...p, file: king!.file, rank: king!.rank, hasMoved: true };
    }
    
    return p;
  });
  
  return {
    ...gameState,
    pieces: updatedPieces,
    currentTurn: gameState.currentTurn === 'white' ? 'black' : 'white',
    moveHistory: [...gameState.moveHistory, {
      type: 'castle',
      castleType: 'kingside',
      color: request.color,
      track: request.track,
    }],
  };
}
```

### Queenside Castling (Bridge)

King and rook cross between QL and KL boards on the back-rank bridge:

```typescript
interface QueensideCastleRequest {
  color: 'white' | 'black';
}

function validateQueensideCastle(
  request: QueensideCastleRequest,
  gameState: GameState
): { valid: boolean; reason?: string } {
  // For White: KL1 ↔ QL1 on rank 0
  // For Black: KL6 ↔ QL6 on rank 9
  const backRank = request.color === 'white' ? 0 : 9;
  const kingPin = request.color === 'white' ? 1 : 6;
  const queenPin = request.color === 'white' ? 1 : 6;
  
  const klState = gameState.trackStates.KL;
  const qlState = gameState.trackStates.QL;
  
  // 1. Check both boards at correct pins
  const klBoardPin = request.color === 'white' ? klState.whiteBoardPin : klState.blackBoardPin;
  const qlBoardPin = request.color === 'white' ? qlState.whiteBoardPin : qlState.blackBoardPin;
  
  if (klBoardPin !== kingPin || qlBoardPin !== queenPin) {
    return { valid: false, reason: 'Boards not at bridge positions' };
  }
  
  // 2. Check both boards controlled by player
  const klController = getBoardController(request.color, klState);
  const qlController = getBoardController(request.color, qlState);
  
  if (klController !== request.color || qlController !== request.color) {
    return { valid: false, reason: 'Boards not controlled by player' };
  }
  
  // 3. Find king on KL and rook on QL (or vice versa - check both)
  const klRotation = request.color === 'white' ? klState.whiteRotation : klState.blackRotation;
  const qlRotation = request.color === 'white' ? qlState.whiteRotation : qlState.blackRotation;
  
  const klInstance = `KL${kingPin}:${klRotation}`;
  const qlInstance = `QL${queenPin}:${qlRotation}`;
  
  const king = gameState.pieces.find(
    p => p.type === 'king' && 
         p.color === request.color && 
         (p.level === klInstance || p.level === qlInstance) &&
         p.rank === backRank
  );
  
  const rook = gameState.pieces.find(
    p => p.type === 'rook' && 
         p.color === request.color && 
         (p.level === klInstance || p.level === qlInstance) &&
         p.rank === backRank
  );
  
  if (!king || !rook) {
    return { valid: false, reason: 'King or rook not on back rank bridge' };
  }
  
  // 4. King and rook must be on opposite boards
  if (king.level === rook.level) {
    return { valid: false, reason: 'King and rook must be on opposite boards for queenside castle' };
  }
  
  // 5. Check neither has moved
  if (king.hasMoved || rook.hasMoved) {
    return { valid: false, reason: 'King or rook has already moved' };
  }
  
  // 6. Check king not in check
  if (isInCheck(request.color, gameState)) {
    return { valid: false, reason: 'King is in check' };
  }
  
  // 7. Check path squares not attacked
  // King must traverse from current square to destination
  const pathSquares = getBridgeCastlePath(king, rook, gameState);
  for (const square of pathSquares) {
    if (isSquareAttacked(square, request.color, gameState)) {
      return { valid: false, reason: 'King path is attacked' };
    }
  }
  
  return { valid: true };
}

function executeQueensideCastle(
  request: QueensideCastleRequest,
  gameState: GameState
): GameState {
  const backRank = request.color === 'white' ? 0 : 9;
  const kingPin = request.color === 'white' ? 1 : 6;
  const queenPin = request.color === 'white' ? 1 : 6;
  
  const klRotation = request.color === 'white' 
    ? gameState.trackStates.KL.whiteRotation 
    : gameState.trackStates.KL.blackRotation;
  const qlRotation = request.color === 'white' 
    ? gameState.trackStates.QL.whiteRotation 
    : gameState.trackStates.QL.blackRotation;
  
  const klInstance = `KL${kingPin}:${klRotation}`;
  const qlInstance = `QL${queenPin}:${qlRotation}`;
  
  const updatedPieces = gameState.pieces.map(p => {
    if (p.color !== request.color || p.rank !== backRank) return p;
    
    if (p.type === 'king') {
      // King crosses to opposite board
      const newLevel = p.level === klInstance ? qlInstance : klInstance;
      const rook = gameState.pieces.find(
        piece => piece.type === 'rook' && piece.color === request.color && piece.rank === backRank
      );
      return { 
        ...p, 
        file: rook!.file, 
        rank: rook!.rank, 
        level: newLevel,
        hasMoved: true 
      };
    } else if (p.type === 'rook') {
      // Rook crosses to opposite board
      const newLevel = p.level === klInstance ? qlInstance : klInstance;
      const king = gameState.pieces.find(
        piece => piece.type === 'king' && piece.color === request.color && piece.rank === backRank
      );
      return { 
        ...p, 
        file: king!.file, 
        rank: king!.rank, 
        level: newLevel,
        hasMoved: true 
      };
    }
    
    return p;
  });
  
  return {
    ...gameState,
    pieces: updatedPieces,
    currentTurn: gameState.currentTurn === 'white' ? 'black' : 'white',
    moveHistory: [...gameState.moveHistory, {
      type: 'castle',
      castleType: 'queenside',
      color: request.color,
    }],
  };
}
```

---

## Pawn Promotion Implementation

### Dynamic Furthest Rank

Pawn promotion rank depends on file and attack board configuration:

```typescript
function getFurthestRank(
  file: number,
  color: 'white' | 'black',
  gameState: GameState
): number {
  const fileChar = ['z', 'a', 'b', 'c', 'd', 'e'][file];
  
  // Files b, c: Fixed promotion ranks
  if (fileChar === 'b' || fileChar === 'c') {
    return color === 'white' ? 1 : 8;
  }
  
  // Files z, e: Always on outer edge (rank 0/9)
  if (fileChar === 'z' || fileChar === 'e') {
    // Check if the promotion square exists
    const targetRank = color === 'white' ? 0 : 9;
    const track = fileChar === 'z' ? 'QL' : 'KL';
    const pin = color === 'white' ? 1 : 6;
    
    // Check if board exists at this pin
    const trackState = gameState.trackStates[track];
    const boardAtPin = (color === 'white' && trackState.whiteBoardPin === pin) ||
                       (color === 'black' && trackState.blackBoardPin === pin);
    
    if (!boardAtPin) {
      // Promotion plane missing - pawn cannot advance further
      return color === 'white' ? 1 : 8;  // Falls back to main board edge
    }
    
    return targetRank;
  }
  
  // Files a, d: Dynamic based on corner overhang
  if (fileChar === 'a' || fileChar === 'd') {
    const track = fileChar === 'a' ? 'QL' : 'KL';
    const cornerPin = color === 'white' ? 6 : 1;  // Opposite color's pin
    
    // Check if opposite color's board overhangs this corner
    const trackState = gameState.trackStates[track];
    const overhangPresent = (color === 'white' && trackState.blackBoardPin === cornerPin) ||
                            (color === 'black' && trackState.whiteBoardPin === cornerPin);
    
    if (overhangPresent) {
      return color === 'white' ? 0 : 9;  // Promote on attack board
    } else {
      return color === 'white' ? 1 : 8;  // Promote on main board
    }
  }
  
  throw new Error(`Invalid file: ${file}`);
}
```

### Deferred Promotion

When a pawn reaches a corner square blocked by an attack board overhang:

```typescript
interface DeferredPromotion {
  pieceId: string;
  square: { file: number; rank: number; level: string };
  blockingTrack: 'QL' | 'KL';
  blockingPin: number;
}

function checkDeferredPromotion(
  piece: Piece,
  gameState: GameState
): DeferredPromotion | null {
  if (piece.type !== 'pawn') return null;
  
  const fileChar = ['z', 'a', 'b', 'c', 'd', 'e'][piece.file];
  
  // Only files a, d can have deferred promotion
  if (fileChar !== 'a' && fileChar !== 'd') return null;
  
  const cornerRank = piece.color === 'white' ? 8 : 1;
  const cornerLevel = piece.color === 'white' ? 'B' : 'W';
  
  // Check if pawn is on corner square
  if (piece.rank !== cornerRank || piece.level !== cornerLevel) return null;
  
  // Check if attack board overhangs this corner
  const track = fileChar === 'a' ? 'QL' : 'KL';
  const overhangPin = piece.color === 'white' ? 6 : 1;
  
  const trackState = gameState.trackStates[track];
  const overhangPresent = (piece.color === 'white' && trackState.blackBoardPin === overhangPin) ||
                          (piece.color === 'black' && trackState.whiteBoardPin === overhangPin);
  
  if (overhangPresent) {
    return {
      pieceId: piece.id,
      square: { file: piece.file, rank: piece.rank, level: piece.level },
      blockingTrack: track,
      blockingPin: overhangPin,
    };
  }
  
  return null;
}

function checkForcedPromotion(
  gameState: GameState
): DeferredPromotion | null {
  // After any attack board move, check if a deferred promotion must now occur
  for (const piece of gameState.pieces) {
    if (piece.type !== 'pawn') continue;
    
    const deferredPromo = checkDeferredPromotion(piece, gameState);
    
    // If there WAS a deferred promotion but overhang is now gone, force promotion
    // This requires tracking previous state - implement as part of game state
    if (piece.deferredPromotion && !deferredPromo) {
      return piece.deferredPromotion;
    }
  }
  
  return null;
}
```

### Pawn Move Validation with movedByAB Flag

```typescript
function validatePawnMove(
  pawn: Piece,
  toSquare: { file: number; rank: number; level: string },
  gameState: GameState
): { valid: boolean; reason?: string } {
  // ... standard pawn move validation ...
  
  // Check double-step restriction
  const rankDiff = Math.abs(toSquare.rank - pawn.rank);
  
  if (rankDiff === 2) {
    // Double-step move
    if (pawn.hasMoved) {
      return { valid: false, reason: 'Pawn has already moved' };
    }
    
    if (pawn.movedByAB) {
      return { valid: false, reason: 'Pawn transported by attack board cannot double-step' };
    }
  }
  
  // ... rest of validation ...
  
  return { valid: true };
}

function validateEnPassant(
  capturingPawn: Piece,
  capturedPawn: Piece,
  gameState: GameState
): { valid: boolean; reason?: string } {
  // Either pawn having movedByAB flag disables en passant
  if (capturingPawn.movedByAB || capturedPawn.movedByAB) {
    return { valid: false, reason: 'En passant disabled for transported pawns' };
  }
  
  // ... rest of en passant validation ...
  
  return { valid: true };
}
```

---

## Graphics Rendering Changes

### Rendering Philosophy

With the visibility-toggle system, rendering is straightforward:
- **Main boards**: Always visible (3 boards)
- **Attack boards**: Only render instances where `isVisible === true` (4 max at any time)
- **No transforms**: Rotation and position already baked into each instance

### Board Rendering

```typescript
// BoardRenderer.tsx
function BoardRenderer({ world, trackStates }: Props) {
  return (
    <>
      {/* Render all boards, filtering attack boards by visibility */}
      {Array.from(world.boards.values())
        .filter(board => board.type === 'main' || board.isVisible)
        .map(board => (
          <SingleBoard 
            key={board.instanceId || board.id} 
            board={board}
          />
        ))}
    </>
  );
}

// SingleBoard component
function SingleBoard({ board }: { board: BoardInstance }) {
  return (
    <group position={[board.centerX, board.centerY, board.centerZ]}>
      {/* Platform mesh */}
      <mesh>
        <boxGeometry args={[board.size.width * SQUARE_SIZE, board.size.height * SQUARE_SIZE, 0.2]} />
        <meshStandardMaterial color={THEME.platform.color} />
      </mesh>
      
      {/* Render squares */}
      {Array.from(world.squares.values())
        .filter(sq => sq.boardId === board.instanceId)
        .map(square => (
          <Square key={square.id} square={square} />
        ))}
    </group>
  );
}
```

### Piece Rendering

Pieces reference instance IDs in their `level` property:

```typescript
// Pieces3D.tsx
function Pieces3D({ pieces, world }: Props) {
  return (
    <>
      {pieces.map(piece => {
        // Resolve piece's square from its current instance
        const squareId = `${piece.file}-${piece.rank}-${piece.level}`;
        const square = world.squares.get(squareId);
        
        if (!square) {
          console.error(`Square not found for piece ${piece.id} at ${squareId}`);
          return null;
        }
        
        return (
          <ChessPieceModel
            key={piece.id}
            piece={piece}
            position={[square.worldX, square.worldY, square.worldZ + 0.5]}
          />
        );
      })}
    </>
  );
}
```

### Attack Board Selection UI

When selecting a board for activation:

```typescript
interface ActivationUIState {
  selectedTrack: 'QL' | 'KL' | null;
  selectedColor: 'white' | 'black' | null;
  eligiblePins: number[];  // Which pins can this board move to
}

function BoardSelectionUI({ gameState, onActivate }: Props) {
  const [uiState, setUIState] = useState<ActivationUIState>({
    selectedTrack: null,
    selectedColor: null,
    eligiblePins: [],
  });
  
  function handleBoardClick(track: 'QL' | 'KL', color: 'white' | 'black') {
    // Determine eligible destination pins
    const trackState = gameState.trackStates[track];
    const currentPin = color === 'white' ? trackState.whiteBoardPin : trackState.blackBoardPin;
    const neighbors = gameState.world.adjacencyGraph[track][currentPin];
    
    const eligiblePins = neighbors
      .filter(n => n.track === track)  // Same-track moves only (cross-track shown separately)
      .map(n => n.pin)
      .filter(pin => !isPinOccupied(track, pin, trackState));
    
    setUIState({
      selectedTrack: track,
      selectedColor: color,
      eligiblePins,
    });
  }
  
  return (
    <>
      {/* Highlight selected board */}
      {uiState.selectedTrack && (
        <BoardHighlight 
          track={uiState.selectedTrack} 
          color={uiState.selectedColor!}
          gameState={gameState}
        />
      )}
      
      {/* Show eligible pin markers */}
      {uiState.eligiblePins.map(pin => (
        <PinMarker
          key={pin}
          track={uiState.selectedTrack!}
          pin={pin}
          onClick={() => handlePinClick(pin)}
        />
      ))}
    </>
  );
}
```

### Pin Visualization

Visual markers at pin positions to show move targets:

```typescript
function PinMarker({ track, pin, onClick }: Props) {
  const pinRankOffset = PIN_RANK_OFFSETS[pin];
  const baseFile = track === 'QL' ? 0 : 4;
  
  // Calculate center of where board would be at this pin
  const centerX = (fileToWorldX(baseFile) + fileToWorldX(baseFile + 1)) / 2;
  const centerY = (rankToWorldY(pinRankOffset) + rankToWorldY(pinRankOffset + 1)) / 2;
  const centerZ = getAttackBoardZHeight(track, pin);
  
  return (
    <mesh 
      position={[centerX, centerY, centerZ + 0.3]}
      onClick={onClick}
    >
      <cylinderGeometry args={[0.8, 0.8, 0.2, 32]} />
      <meshStandardMaterial 
        color={THEME.pinMarker.eligible}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}
```

### Arrival Choice Visualization

When passenger piece has two landing options:

```typescript
function ArrivalChoiceUI({ options, onChoose }: Props) {
  return (
    <>
      {options.map(option => {
        const square = world.squares.get(option.squareId);
        if (!square) return null;
        
        return (
          <mesh
            key={option.choice}
            position={[square.worldX, square.worldY, square.worldZ + 0.1]}
            onClick={() => onChoose(option.choice)}
          >
            <planeGeometry args={[SQUARE_SIZE * 0.8, SQUARE_SIZE * 0.8]} />
            <meshStandardMaterial
              color={option.choice === 'identity' ? '#4CAF50' : '#FF9800'}
              transparent
              opacity={0.6}
            />
          </mesh>
        );
      })}
      
      {/* Labels */}
      {options.map(option => (
        <Text
          key={`label-${option.choice}`}
          position={[square.worldX, square.worldY, square.worldZ + 0.5]}
          fontSize={0.5}
          color="white"
        >
          {option.choice === 'identity' ? 'Same Position' : 'Rotated'}
        </Text>
      ))}
    </>
  );
}
```

### Debug Visualization

During development, optionally show all instances:

```typescript
function DebugInstanceVisualization({ world, trackStates }: Props) {
  if (!DEBUG_MODE) return null;
  
  return (
    <>
      {Array.from(world.boards.values())
        .filter(b => b.type === 'attack')
        .map(board => (
          <mesh
            key={board.instanceId}
            position={[board.centerX, board.centerY, board.centerZ]}
          >
            <boxGeometry args={[
              board.size.width * SQUARE_SIZE,
              board.size.height * SQUARE_SIZE,
              0.1
            ]} />
            <meshStandardMaterial
              color={board.isVisible ? '#00FF00' : '#FF0000'}
              transparent
              opacity={board.isVisible ? 0.3 : 0.1}
              wireframe
            />
          </mesh>
        ))}
    </>
  );
}
```

---

## Test Strategy

### Unit Tests

**World Builder Tests:**
```typescript
describe('createChessWorld with revised Meder system', () => {
  it('should create 27 total boards (3 main + 24 attack instances)', () => {
    const world = createChessWorld();
    expect(world.boards.size).toBe(27);
  });
  
  it('should create 12 instances per track (6 pins × 2 rotations)', () => {
    const world = createChessWorld();
    const qlInstances = Array.from(world.boards.values())
      .filter(b => b.type === 'attack' && b.instanceId.startsWith('QL'));
    expect(qlInstances.length).toBe(12);
  });
  
  it('should have correct pin rank offsets', () => {
    const world = createChessWorld();
    const ql2 = world.boards.get('QL2:0');
    expect(ql2.ranks).toEqual([4, 5]);
    
    const kl3 = world.boards.get('KL3:0');
    expect(kl3.ranks).toEqual([2, 3]);
  });
  
  it('should initialize all attack boards as invisible', () => {
    const world = createChessWorld();
    const attackBoards = Array.from(world.boards.values())
      .filter(b => b.type === 'attack');
    
    attackBoards.forEach(board => {
      expect(board.isVisible).toBe(false);
      expect(board.isAccessible).toBe(false);
    });
  });
});
```

**Track State Tests:**
```typescript
describe('Track state and ownership', () => {
  it('should correctly identify pin owner', () => {
    const trackState: TrackState = {
      track: 'QL',
      whiteBoardPin: 1,
      blackBoardPin: 6,
      whiteRotation: 0,
      blackRotation: 0,
      whitePassenger: null,
      blackPassenger: null,
    };
    
    expect(getPinOwner('QL', 1, trackState)).toBe('white');
    expect(getPinOwner('QL', 6, trackState)).toBe('black');
    expect(getPinOwner('QL', 3, trackState)).toBe(null);
  });
  
  it('should make correct instances visible after initialization', () => {
    const gameState = createInitialGameState();
    
    expect(gameState.world.boards.get('QL1:0').isVisible).toBe(true);
    expect(gameState.world.boards.get('KL1:0').isVisible).toBe(true);
    expect(gameState.world.boards.get('QL6:0').isVisible).toBe(true);
    expect(gameState.world.boards.get('KL6:0').isVisible).toBe(true);
    
    // All others invisible
    expect(gameState.world.boards.get('QL2:0').isVisible).toBe(false);
    expect(gameState.world.boards.get('QL3:180').isVisible).toBe(false);
  });
});
```

**Activation Tests:**
```typescript
describe('Attack board activation', () => {
  it('should validate adjacency correctly', () => {
    const gameState = createInitialGameState();
    
    // QL1 -> QL2 is adjacent
    const valid = validateActivation({
      track: 'QL',
      color: 'white',
      toPin: 2,
      rotation: 0,
    }, gameState);
    expect(valid.valid).toBe(true);
    
    // QL1 -> QL4 is not adjacent
    const invalid = validateActivation({
      track: 'QL',
      color: 'white',
      toPin: 4,
      rotation: 0,
    }, gameState);
    expect(invalid.valid).toBe(false);
    expect(invalid.reason).toContain('not adjacent');
  });
  
  it('should prevent backward movement when board is occupied', () => {
    const gameState = createGameStateWithPassenger('QL', 'white', 3);
    
    const backward = validateActivation({
      track: 'QL',
      color: 'white',
      toPin: 2,  // Backward for white
      rotation: 0,
    }, gameState);
    
    expect(backward.valid).toBe(false);
    expect(backward.reason).toContain('backward');
  });
  
  it('should allow forward and sideways movement when occupied', () => {
    const gameState = createGameStateWithPassenger('QL', 'white', 2);
    
    // Forward (increasing pin for white)
    const forward = validateActivation({
      track: 'QL',
      color: 'white',
      toPin: 3,
      rotation: 0,
    }, gameState);
    expect(forward.valid).toBe(true);
    
    // Sideways (cross-track)
    const sideways = validateActivation({
      track: 'KL',
      color: 'white',
      toPin: 2,
      rotation: 0,
    }, gameState);
    expect(sideways.valid).toBe(true);
  });
});
```

**Arrival Mapping Tests:**
```typescript
describe('Two-square arrival mapping', () => {
  it('should calculate identity mapping correctly', () => {
    const fromBoard = createMockBoard('QL2:0', 0, 4);  // files z,a; ranks 4,5
    const toBoard = createMockBoard('QL5:0', 0, 4);     // files z,a; ranks 4,5
    
    const piece = { file: 0, rank: 4 };  // z4 (local 0,0)
    
    const result = calculateArrivalCoordinates(piece, fromBoard, toBoard, 'identity');
    expect(result).toEqual({ file: 0, rank: 4 });  // Same position
  });
  
  it('should calculate rotation mapping correctly', () => {
    const fromBoard = createMockBoard('QL2:0', 0, 4);
    const toBoard = createMockBoard('QL5:0', 0, 4);
    
    const piece = { file: 0, rank: 4 };  // z4 (local 0,0)
    
    const result = calculateArrivalCoordinates(piece, fromBoard, toBoard, 'rotation');
    expect(result).toEqual({ file: 1, rank: 5 });  // a5 (local 1,1)
  });
  
  it('should handle all four quadrants correctly', () => {
    const fromBoard = createMockBoard('KL1:0', 4, 0);  // files d,e; ranks 0,1
    const toBoard = createMockBoard('KL3:0', 4, 2);     // files d,e; ranks 2,3
    
    const testCases = [
      { from: { file: 4, rank: 0 }, identity: { file: 4, rank: 2 }, rotation: { file: 5, rank: 3 } },
      { from: { file: 5, rank: 0 }, identity: { file: 5, rank: 2 }, rotation: { file: 4, rank: 3 } },
      { from: { file: 4, rank: 1 }, identity: { file: 4, rank: 3 }, rotation: { file: 5, rank: 2 } },
      { from: { file: 5, rank: 1 }, identity: { file: 5, rank: 3 }, rotation: { file: 4, rank: 2 } },
    ];
    
    testCases.forEach(tc => {
      const identityResult = calculateArrivalCoordinates(tc.from, fromBoard, toBoard, 'identity');
      expect(identityResult).toEqual(tc.identity);
      
      const rotationResult = calculateArrivalCoordinates(tc.from, fromBoard, toBoard, 'rotation');
      expect(rotationResult).toEqual(tc.rotation);
    });
  });
});
```

**Castling Tests:**
```typescript
describe('Castling on attack boards', () => {
  it('should allow kingside castle when valid', () => {
    const gameState = createCastlingScenario('kingside', 'white', 'KL');
    
    const result = validateKingsideCastle({
      color: 'white',
      track: 'KL',
    }, gameState);
    
    expect(result.valid).toBe(true);
  });
  
  it('should allow queenside castle across bridge', () => {
    const gameState = createCastlingScenario('queenside', 'white');
    
    const result = validateQueensideCastle({
      color: 'white',
    }, gameState);
    
    expect(result.valid).toBe(true);
  });
  
  it('should prevent castle if king has moved', () => {
    const gameState = createCastlingScenario('kingside', 'white', 'KL');
    const king = gameState.pieces.find(p => p.type === 'king' && p.color === 'white');
    king.hasMoved = true;
    
    const result = validateKingsideCastle({
      color: 'white',
      track: 'KL',
    }, gameState);
    
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('already moved');
  });
});
```

**Pawn Promotion Tests:**
```typescript
describe('Dynamic pawn promotion', () => {
  it('should determine correct promotion rank for file b (fixed)', () => {
    const gameState = createInitialGameState();
    
    const whiteRank = getFurthestRank(1, 'white', gameState);  // file 'a' = index 1
    expect(whiteRank).toBe(1);
    
    const blackRank = getFurthestRank(1, 'black', gameState);
    expect(blackRank).toBe(8);
  });
  
  it('should adjust promotion rank for file a based on overhang', () => {
    const gameState = createInitialGameState();
    
    // Initially, Black's QL board is at QL6, overhanging a8
    const whiteRank = getFurthestRank(1, 'white', gameState);  // file 'a'
    expect(whiteRank).toBe(0);  // Overhangs, so promote on attack board
    
    // Move Black's QL board away
    gameState.trackStates.QL.blackBoardPin = 5;
    updateInstanceVisibility(gameState.world, gameState.trackStates);
    
    const whiteRankAfter = getFurthestRank(1, 'white', gameState);
    expect(whiteRankAfter).toBe(1);  // No overhang, promote on main board
  });
  
  it('should detect deferred promotion correctly', () => {
    const pawn: Piece = {
      id: 'test-pawn',
      type: 'pawn',
      color: 'white',
      file: 1,  // file 'a'
      rank: 8,
      level: 'B',
      hasMoved: true,
      movedByAB: false,
    };
    
    const gameState = createGameStateWithPiece(pawn);
    gameState.trackStates.QL.blackBoardPin = 6;  // Overhangs a8
    
    const deferred = checkDeferredPromotion(pawn, gameState);
    expect(deferred).not.toBe(null);
    expect(deferred.blockingTrack).toBe('QL');
    expect(deferred.blockingPin).toBe(6);
  });
  
  it('should prevent double-step for pawn with movedByAB flag', () => {
    const pawn: Piece = {
      id: 'test-pawn',
      type: 'pawn',
      color: 'white',
      file: 2,
      rank: 3,
      level: 'N',
      hasMoved: false,
      movedByAB: true,
    };
    
    const result = validatePawnMove(pawn, { file: 2, rank: 5, level: 'N' }, gameState);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('transported');
  });
});
```

### Integration Tests

Test full game scenarios from REVISED_MEDER_COORDINATE_SYSTEM.md test matrix.

---

## Implementation Phases

### Phase 1: Core Data Structures (Week 1)

**Goal:** Set up new world structure and track state without breaking existing code

**Tasks:**
1. Update type definitions:
   - Add `TrackState` interface
   - Update `BoardInstance` interface with `track`, `pin` properties
   - Update `Piece` interface with `movedByAB` flag
   - Add `PinAdjacencyGraph` interface

2. Update `worldBuilder.ts`:
   - Implement `PIN_RANK_OFFSETS` constant
   - Implement `PIN_ADJACENCY` graph
   - Modify `createChessWorld()` to create 24 attack board instances
   - Update instance naming to `{Track}{Pin}:{Rotation}` format

3. Update `gameStore.ts`:
   - Add `trackStates` to GameState
   - Initialize track states correctly
   - Implement `updateInstanceVisibility()` function

4. Write unit tests for new structures

**Deliverables:**
- All types updated
- World creates 27 boards correctly
- Track states initialize properly
- Tests pass

### Phase 2: Ownership & Adjacency Logic (Week 1-2)

**Goal:** Implement pin ownership and adjacency validation

**Tasks:**
1. Implement ownership functions:
   - `getPinOwner()`
   - `getBoardController()`
   - `isPinOccupied()`
   - `getVacantPins()`

2. Implement adjacency validation:
   - `getAdjacentPins()`
   - `isAdjacent()`

3. Implement direction logic:
   - `getForwardDirection()`
   - `isForwardMove()`
   - `isSidewaysMove()`

4. Write comprehensive tests for all functions

**Deliverables:**
- Ownership queries working
- Adjacency graph functional
- Direction validation correct
- Tests pass

### Phase 3: Activation Logic (Week 2)

**Goal:** Implement attack board activation with validation

**Tasks:**
1. Implement `validateActivation()`:
   - Adjacency check
   - Occupancy check
   - Direction restrictions
   - Controller validation
   - King safety

2. Implement `executeActivation()`:
   - Track state updates
   - Piece coordinate updates
   - Instance visibility toggling
   - Passenger tracking

3. Implement passenger management:
   - `getPieceBoard()`
   - `updatePassengerTracking()`

4. Write activation tests

**Deliverables:**
- Activation validation working
- Activation execution working
- Visibility toggling functional
- Tests pass

### Phase 4: Two-Square Arrival Mapping (Week 2-3)

**Goal:** Implement passenger arrival choice system

**Tasks:**
1. Implement coordinate mapping:
   - `calculateArrivalCoordinates()`
   - Identity mapping
   - Rotation mapping

2. Implement UI helpers:
   - `getArrivalOptions()`
   - `validateArrivalSquares()`

3. Update activation execution to use arrival choice

4. Write mapping tests

**Deliverables:**
- Arrival mapping working
- UI can present options
- Tests pass for all quadrants

### Phase 5: Castling (Week 3)

**Goal:** Implement attack board castling

**Tasks:**
1. Implement kingside castling:
   - `validateKingsideCastle()`
   - `executeKingsideCastle()`

2. Implement queenside bridge castling:
   - `validateQueensideCastle()`
   - `executeQueensideCastle()`
   - `getBridgeCastlePath()`

3. Write castling tests

**Deliverables:**
- Both castle types working
- Validation comprehensive
- Tests pass

### Phase 6: Pawn Promotion (Week 3-4)

**Goal:** Implement dynamic pawn promotion with deferred promotion

**Tasks:**
1. Implement dynamic rank determination:
   - `getFurthestRank()`
   - Handle all file types (b/c, z/e, a/d)
   - Check for missing promotion planes

2. Implement deferred promotion:
   - `checkDeferredPromotion()`
   - `checkForcedPromotion()`
   - Track deferred state in pieces

3. Update pawn move validation:
   - Check `movedByAB` flag
   - Disable double-step
   - Disable en passant

4. Write promotion tests

**Deliverables:**
- Dynamic promotion working
- Deferred promotion working
- movedByAB flag respected
- Tests pass

### Phase 7: Rendering Updates (Week 4)

**Goal:** Update 3D rendering to use visibility system

**Tasks:**
1. Update BoardRenderer:
   - Filter by visibility
   - Remove rotation transforms

2. Update Pieces3D:
   - Use instance-based levels
   - Resolve squares correctly

3. Implement UI components:
   - Board selection highlighting
   - Pin markers
   - Arrival choice visualization

4. Manual testing of visuals

**Deliverables:**
- Rendering works correctly
- Only 4 attack boards visible
- UI intuitive
- No visual bugs

### Phase 8: Integration & Polish (Week 4-5)

**Goal:** Full game playthrough and bug fixes

**Tasks:**
1. Integration testing:
   - Play complete games
   - Test all special moves
   - Test edge cases

2. Performance optimization:
   - Profile rendering
   - Optimize lookups
   - Add memoization where needed

3. Documentation:
   - Update code comments
   - Document new APIs
   - Update user guide

4. Bug fixes and polish

**Deliverables:**
- Full games playable
- All features working
- Performance acceptable
- Documentation complete

---

## Edge Cases & Considerations

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

### 1. Cross-Track Movement
**Issue:** A board moving from QL to KL (or vice versa)

**Solution:**
- Track adjacency graph includes cross-track connections
- Validation checks adjacency across tracks
- When moving QL3 → KL3, update both track states:
  - QL track loses White's/Black's board
  - KL track gains that board
- **Implementation note:** This requires special handling since we're modeling as two separate tracks

**Revised approach:** Cross-track movement is actually just a different adjacency relationship. The board stays on its original track in terms of ownership, but the adjacency graph shows which pins connect across tracks.

**Actually:** Per revised Meder rules, boards move between pins on the **same track only**. Cross-track adjacency is for determining valid moves, but boards don't change tracks. This simplifies implementation.

### 2. Passenger Count Restrictions
**Rule:** Maximum 1 passenger per attack board

**Enforcement:**
```typescript
function validatePieceMove(
  piece: Piece,
  toSquare: { file: number; rank: number; level: string },
  gameState: GameState
): { valid: boolean; reason?: string } {
  // If moving onto an attack board, check passenger limit
  if (toSquare.level.match(/^(QL|KL)\d:\d+$/)) {
    const boardInfo = getPieceBoard({ ...piece, level: toSquare.level }, gameState);
    const trackState = gameState.trackStates[boardInfo.track!];
    const currentPassenger = boardInfo.color === 'white' 
      ? trackState.whitePassenger 
      : trackState.blackPassenger;
    
    if (currentPassenger && currentPassenger.id !== piece.id) {
      return { valid: false, reason: 'Attack board already has a passenger' };
    }
  }
  
  return { valid: true };
}
```

### 3. Piece Movement Between Boards
**Issue:** When a piece moves from attack board to main board (or vice versa), update passenger tracking

**Solution:**
```typescript
function executePieceMove(move: PieceMove, gameState: GameState): GameState {
  const piece = gameState.pieces.find(p => p.id === move.pieceId);
  const fromBoard = getPieceBoard(piece, gameState);
  const toBoard = getPieceBoard({ ...piece, level: move.toSquare.level }, gameState);
  
  // Update piece
  const updatedPieces = gameState.pieces.map(p => 
    p.id === piece.id ? { ...p, ...move.toSquare, hasMoved: true } : p
  );
  
  // Clear passenger from source attack board (if applicable)
  if (fromBoard.type === 'attack') {
    const trackState = gameState.trackStates[fromBoard.track!];
    if (fromBoard.color === 'white') {
      trackState.whitePassenger = null;
    } else {
      trackState.blackPassenger = null;
    }
  }
  
  // Set passenger on destination attack board (if applicable)
  if (toBoard.type === 'attack') {
    const trackState = gameState.trackStates[toBoard.track!];
    const updatedPiece = updatedPieces.find(p => p.id === piece.id);
    if (toBoard.color === 'white') {
      trackState.whitePassenger = updatedPiece;
    } else {
      trackState.blackPassenger = updatedPiece;
    }
  }
  
  return {
    ...gameState,
    pieces: updatedPieces,
    trackStates: { ...gameState.trackStates },
  };
}
```

### 4. Rotation Without Movement
**Issue:** Can a player rotate their board without moving it to a different pin?

**Per revised Meder rules:** Not explicitly addressed, but rotation is tied to activation (movement). If we want to support rotation-in-place:

```typescript
function rotateInPlace(
  track: 'QL' | 'KL',
  color: 'white' | 'black',
  newRotation: 0 | 180,
  gameState: GameState
): GameState {
  // This is essentially activation to same pin with different rotation
  const trackState = gameState.trackStates[track];
  const currentPin = color === 'white' ? trackState.whiteBoardPin : trackState.blackBoardPin;
  
  return executeActivation({
    track,
    color,
    toPin: currentPin,  // Same pin
    rotation: newRotation,
  }, gameState, 'identity');  // No coordinate change needed
}
```

**Recommendation:** Only allow rotation as part of activation to different pin (simpler, matches physical model).

### 5. Save/Load with Track States
**Challenge:** Serializing and deserializing track states

**Solution:**
```typescript
interface GameSnapshot {
  version: string;
  pieces: Piece[];
  trackStates: {
    QL: TrackState;
    KL: TrackState;
  };
  currentTurn: 'white' | 'black';
  moveHistory: Move[];
  // ... other state
}

function serializeGameState(gameState: GameState): string {
  const snapshot: GameSnapshot = {
    version: '2.0',  // New version with track states
    pieces: gameState.pieces,
    trackStates: gameState.trackStates,
    currentTurn: gameState.currentTurn,
    moveHistory: gameState.moveHistory,
  };
  
  return JSON.stringify(snapshot);
}

function deserializeGameState(json: string, world: ChessWorld): GameState {
  const snapshot = JSON.parse(json) as GameSnapshot;
  
  // Migrate old format if needed
  if (snapshot.version === '1.0' || !snapshot.trackStates) {
    return migrateOldSave(snapshot, world);
  }
  
  // Restore instance visibility based on track states
  updateInstanceVisibility(world, snapshot.trackStates);
  
  return {
    world,
    pieces: snapshot.pieces,
    trackStates: snapshot.trackStates,
    currentTurn: snapshot.currentTurn,
    moveHistory: snapshot.moveHistory,
  };
}
```

### 6. Missing Promotion Plane Edge Case
**Issue:** Pawn on z1 or e8 when corresponding attack board not at pin 1/6

**Behavior:**
- Pawn cannot advance to rank 0/9 (square doesn't exist)
- Pawn effectively frozen until board returns
- Not a bug - this is by design per revised Meder rules

**UI consideration:** Show indicator that pawn cannot promote due to missing plane

### 7. Forced Promotion Interruption
**Issue:** Black moves attack board away from corner, forcing White pawn to promote. Whose turn is it?

**Solution:**
```typescript
function checkForcedPromotionAfterMove(gameState: GameState): GameState {
  const forcedPromo = checkForcedPromotion(gameState);
  
  if (forcedPromo) {
    // Interrupt normal turn flow
    // The player whose pawn must promote gets to choose the piece
    // before the turn switches back
    return {
      ...gameState,
      pendingPromotion: forcedPromo,
      // Don't switch turn yet - wait for promotion choice
    };
  }
  
  return gameState;
}
```

### 8. Castling After Transport
**Issue:** If king is transported via attack board activation, can it still castle?

**Per standard chess rules:** No - king sets `hasMoved = true` during transport

**Revised Meder rules don't explicitly address this, so:** Follow standard interpretation - any piece movement (including as passenger) sets hasMoved flag, preventing castling.

### 9. Performance - 24 vs Current System
**Current:** 4 active boards, coordinates update on move
**New:** 24 pre-created instances, 4 visible, visibility toggles

**Memory comparison:**
- Current: 4 boards × 4 squares × ~200 bytes = ~3.2 KB
- New: 24 boards × 4 squares × ~200 bytes = ~19.2 KB

**Negligible difference** - the ~16 KB increase is trivial for modern systems.

**Rendering comparison:**
- Current: Render 4 boards, 16 total squares (attack boards only)
- New: Render 4 boards, 16 total squares (identical)

**No performance impact** - same number of visible objects.

### 10. Animation Between Instances
**If animation desired later:**

```typescript
function animateBoardTransition(
  fromInstance: string,
  toInstance: string,
  duration: number
): void {
  const fromBoard = world.boards.get(fromInstance);
  const toBoard = world.boards.get(toInstance);
  
  // Approach: Interpolate between positions
  // This is purely visual - game state updates immediately
  
  const startPos = { x: fromBoard.centerX, y: fromBoard.centerY, z: fromBoard.centerZ };
  const endPos = { x: toBoard.centerX, y: toBoard.centerY, z: toBoard.centerZ };
  
  // Create temporary animated mesh
  const animatedBoard = createGhostBoard(fromBoard);
  
  animate(animatedBoard, startPos, endPos, duration, () => {
    // On complete: just remove ghost (real board already visible)
    removeGhostBoard(animatedBoard);
  });
}
```

**Recommendation:** Implement only if user feedback indicates need. Start with instant toggle.

---

## Summary

### System Architecture

**Core Principle:** Visibility-toggling over 3D movement

**Key Components:**
1. **24 pre-created attack board instances** (12 per track)
2. **Track state management** (pin positions, rotations, passengers)
3. **Dynamic ownership** (computed from track states)
4. **Two-square arrival** (identity + rotation options)
5. **Special rules** (castling, dynamic promotion, pawn flags)

### Data Flow

```
User initiates activation
  ↓
Validate (adjacency, occupancy, direction, king safety)
  ↓
If passenger exists, present arrival options
  ↓
User chooses arrival option
  ↓
Execute activation:
  - Update track state (new pin, rotation)
  - Update piece coordinates (if passenger)
  - Set movedByAB flag
  - Toggle instance visibility
  ↓
Check for forced promotion
  ↓
Update rendering (automatic via visibility flags)
```

### Benefits

1. **Simplicity:** No runtime coordinate calculations for board positions
2. **Correctness:** Pre-calculated coordinates prevent alignment bugs
3. **Flexibility:** Easy to add new pin positions or rotation angles
4. **Performance:** Only 4 boards rendered regardless of total instances
5. **Debuggability:** Can visualize all instances during development

### Implementation Complexity

**Low complexity changes:**
- Type definitions
- World builder (straightforward expansion)
- Rendering (filter by visibility)

**Medium complexity changes:**
- Track state management
- Activation validation
- Arrival mapping

**High complexity changes:**
- Castling (especially queenside bridge)
- Dynamic pawn promotion
- Forced promotion interrupts

**Estimated total effort:** 4-5 weeks for complete implementation and testing

### Migration Strategy

**Cannot support backward compatibility** due to fundamental architectural change. Old save files will need migration:

```typescript
// Version 1.0: attackBoardPositions = { WQL: 'QL1', WKL: 'KL1', ... }
// Version 2.0: trackStates = { QL: { whiteBoardPin: 1, ... }, KL: { ... } }
```

**Recommendation:** Clear communication to users that saves will be incompatible, possibly with one-time migration tool.

---

## Testing Checklist

### Unit Tests
- [ ] World builder creates correct number of instances
- [ ] Pin rank offsets correct for all pins
- [ ] Adjacency graph symmetric and complete
- [ ] Track state ownership queries correct
- [ ] Activation validation checks all conditions
- [ ] Arrival mapping calculations correct for all quadrants
- [ ] Castling validation comprehensive
- [ ] Dynamic promotion rank determination correct
- [ ] movedByAB flag enforced in pawn validation

### Integration Tests
- [ ] Full activation flow (select → validate → execute → render)
- [ ] Passenger transport with arrival choice
- [ ] Cross-track adjacency works
- [ ] Kingside castling executes correctly
- [ ] Queenside bridge castling executes correctly
- [ ] Deferred promotion triggers when overhang removed
- [ ] Forced promotion interrupts turn flow correctly
- [ ] Missing promotion plane prevents pawn advance

### Manual/Visual Tests
- [ ] Only 4 attack boards visible at any time
- [ ] Board selection UI shows eligible pins
- [ ] Arrival choice visualization clear
- [ ] Pin markers appear in correct positions
- [ ] Piece rendering correct after activation
- [ ] No visual glitches during transitions
- [ ] Performance acceptable with all instances

### Reference Tests (from REVISED_MEDER_COORDINATE_SYSTEM.md)
- [ ] PIN-OWN test suite
- [ ] ACT (activation) test suite  
- [ ] CSTL (castling) test suite
- [ ] PROMO (promotion) test suite
- [ ] PAWN-FLAGS test suite
- [ ] SHADOW (main↔AB) test suite
- [ ] END (checkmate) test suite

---

## Conclusion

This implementation plan provides a comprehensive roadmap for transitioning to the revised Meder coordinate system using visibility-toggling attack boards. The approach balances simplicity (pre-created instances, no 3D transforms) with completeness (all special rules implemented) while maintaining good performance (only 4 boards rendered).

The phased implementation strategy allows for incremental development and testing, with each phase building on the previous one. The total 4-5 week timeline assumes dedicated development effort and includes comprehensive testing.

Key success factors:
1. **Strict adherence to phase order** - complete each phase before moving to next
2. **Comprehensive test coverage** - both unit and integration tests
3. **Visual validation at each step** - ensure rendering stays correct
4. **Reference to REVISED_MEDER_COORDINATE_SYSTEM.md** - use as source of truth for all rules

**Next steps:**
1. Review this plan with stakeholders
2. Set up project timeline and milestones
3. Begin Phase 1 implementation
4. Establish regular check-ins to track progress

---

**Document Version:** 1.0  
**Status:** Ready for Review  
**Last Updated:** October 9, 2025
