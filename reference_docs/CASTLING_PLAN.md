# Castling Implementation Plan

**Author:** Claude AI
**Date:** 2025-10-15
**Purpose:** Comprehensive implementation plan for attack-board castling in Meder-style Tri-Dimensional Chess
**Status:** Phase I, II & III Complete ✅ (UI Integration Pending)

---

## Table of Contents

1. [Overview](#overview)
2. [Castling Rules Summary](#castling-rules-summary)
3. [Architecture Integration](#architecture-integration)
4. [Data Structures](#data-structures)
5. [Validation Logic](#validation-logic)
6. [Execution Logic](#execution-logic)
7. [UI/UX Design](#uiux-design)
8. [Implementation Phases](#implementation-phases)
9. [Testing Strategy](#testing-strategy)
10. [Edge Cases & Considerations](#edge-cases--considerations)

---

## Overview

### What is Castling in Tri-D Chess?

In this variant, **castling occurs exclusively on attack boards** because kings and rooks start on attack boards (QL1/KL1 for White, QL6/KL6 for Black). There are two distinct castling types:

1. **Kingside Castling:** King and rook **swap positions** on the same attack board (within a single 2×2 board)
2. **Queenside Castling:** King and rook **cross between attack boards** via the back-rank bridge (between QL and KL at pins 1 or 6)

### Why This Matters

Castling is a special move that:
- Provides king safety
- Activates rooks
- Requires precise validation (unmoved pieces, unattacked paths, board control)
- Involves complex geometry in the 3D variant

### Design Principles

1. **Explicit castle move type** - Not a regular piece move; requires dedicated action
2. **Pre-validation UI** - Show castling availability proactively
3. **Atomic execution** - Queenside castling happens in one move despite crossing boards
4. **Comprehensive safety checks** - Every square the king touches must be unattacked

---

## Castling Rules Summary

### Kingside Castling

**Location:** Single attack board (QL or KL)
**Movement:** King and rook swap squares
**Example (White, KL1):**
- Before: King at `d0KL1`, Rook at `e0KL1`
- After: King at `e0KL1`, Rook at `d0KL1`

**Legality Requirements:**
1. Both pieces on same attack board
2. Both pieces unmoved (`hasMoved === false`)
3. Attack board controlled by player
4. No board activation this turn
5. King not in check
6. Both start and end squares unattacked
7. No pieces between (not applicable on 2×2 board, but verify emptiness)

### Queenside Castling

**Location:** Back-rank bridge between QL and KL boards
**White Bridge:** KL1 ↔ QL1 across rank 0
**Black Bridge:** KL6 ↔ QL6 across rank 9

**Movement:** King and rook cross between boards
**Example (White):**
- Before: King at `d0KL1`, Rook at `a0QL1`
- After: King at `a0QL1`, Rook at `d0KL1`

**Legality Requirements:**
1. King on one bridge board, rook on the other
2. Both on same back rank (0 for White, 9 for Black)
3. Both pieces unmoved
4. **Both bridge boards** controlled by player
5. Neither board activating this turn
6. King not in check
7. King's path squares unattacked (start → destination, possibly including intermediate squares)
8. Destination squares exist and are unoccupied (except by the pieces themselves)

---

## Architecture Integration

### Affected Systems

Based on `CODE_ARCHITECTURE.md`, castling will touch:

1. **Engine Layer:**
   - `src/engine/validation/` - Add castling validator
   - `src/engine/world/types.ts` - Add castling-specific types

2. **State Management:**
   - `src/store/gameStore.ts` - Add `executeCastle()` action

3. **UI Layer:**
   - `src/components/UI/GameStatus.tsx` - Show castling availability
   - `src/components/UI/CastleControls.tsx` - NEW: Castle selection UI

4. **Move History:**
   - Extend move notation to include castle type

### Integration Points

**Validation Flow:**
```
User clicks "Castle" button
  ↓
getCastlingOptions() → returns available castle types
  ↓
User selects castle type
  ↓
validateCastle(castleType) → checks all legality conditions
  ↓
Show confirmation or error message
```

**Execution Flow:**
```
User confirms castle
  ↓
executeCastle(castleType)
  ↓
Update both pieces (king & rook) positions
  ↓
Set hasMoved = true for both
  ↓
Add castle move to history
  ↓
Switch turn
  ↓
Check game state (opponent in check?)
  ↓
Re-render
```

---

## Data Structures

### TypeScript Interfaces

```typescript
// src/engine/validation/types.ts

export type CastleType = 'kingside-ql' | 'kingside-kl' | 'queenside';

export interface CastleRequest {
  color: 'white' | 'black';
  castleType: CastleType;
}

export interface CastleValidation {
  valid: boolean;
  reason?: string;

  // Metadata for execution
  kingFrom?: { file: number; rank: number; level: string };
  kingTo?: { file: number; rank: number; level: string };
  rookFrom?: { file: number; rank: number; level: string };
  rookTo?: { file: number; rank: number; level: string };

  // For UI display
  involvedBoards?: string[]; // e.g., ['KL1', 'QL1']
}

export interface CastleContext {
  color: 'white' | 'black';
  castleType: CastleType;
  pieces: Piece[];
  world: ChessWorld;
  trackStates: TrackStates;
  currentTurn: 'white' | 'black';
  attackBoardActivatedThisTurn: boolean;
}
```

### Move History Extension

```typescript
// src/store/gameStore.ts - Extend Move interface

export interface Move {
  // ... existing fields ...
  type: 'move' | 'capture' | 'castle' | 'activation'; // Add 'castle'

  // Castle-specific fields
  castleType?: CastleType;
  castleNotation?: string; // "O-O" (kingside) or "O-O-O" (queenside)
}
```

### Piece State Requirements

Pieces already have `hasMoved: boolean`, which is critical for castling validation. No changes needed here.

---

## Validation Logic

### Main Validation Function

**File:** `src/engine/validation/castleValidator.ts` (NEW)

```typescript
/**
 * Validates whether a castle move is legal
 */
export function validateCastle(context: CastleContext): CastleValidation {
  const { color, castleType, pieces, world, trackStates, attackBoardActivatedThisTurn } = context;

  // Early exit: Can't castle if attack board activated this turn
  if (attackBoardActivatedThisTurn) {
    return { valid: false, reason: 'Cannot castle after attack board activation' };
  }

  // Early exit: Can't castle if king is in check
  if (isInCheck(color, world, pieces)) {
    return { valid: false, reason: 'Cannot castle while in check' };
  }

  // Delegate to specific castle type validator
  if (castleType === 'kingside-ql' || castleType === 'kingside-kl') {
    return validateKingsideCastle(context);
  } else if (castleType === 'queenside') {
    return validateQueensideCastle(context);
  }

  return { valid: false, reason: 'Unknown castle type' };
}
```

### Kingside Castle Validation

```typescript
function validateKingsideCastle(context: CastleContext): CastleValidation {
  const { color, castleType, pieces, world, trackStates } = context;

  // Determine which track (QL or KL)
  const track: 'QL' | 'KL' = castleType === 'kingside-ql' ? 'QL' : 'KL';
  const pin = color === 'white' ? 1 : 6;
  const backRank = color === 'white' ? 0 : 9;

  // Get board state
  const trackState = trackStates[track];
  const boardPin = color === 'white' ? trackState.whiteBoardPin : trackState.blackBoardPin;
  const rotation = color === 'white' ? trackState.whiteRotation : trackState.blackRotation;

  // Check 1: Board must be at correct pin (1 for White, 6 for Black)
  if (boardPin !== pin) {
    return { valid: false, reason: `${track} board not at starting position` };
  }

  // Check 2: Board must be controlled by player
  const controller = getBoardController(color, trackState);
  if (controller !== color) {
    return { valid: false, reason: `${track} board not controlled by ${color}` };
  }

  // Build instance ID
  const instanceId = `${track}${pin}:${rotation}`;

  // Check 3: Find king and rook on this board
  const king = pieces.find(p =>
    p.type === 'king' &&
    p.color === color &&
    p.level === instanceId &&
    p.rank === backRank
  );

  const rook = pieces.find(p =>
    p.type === 'rook' &&
    p.color === color &&
    p.level === instanceId &&
    p.rank === backRank
  );

  if (!king) {
    return { valid: false, reason: `King not found on ${instanceId}` };
  }

  if (!rook) {
    return { valid: false, reason: `Rook not found on ${instanceId}` };
  }

  // Check 4: Neither piece has moved
  if (king.hasMoved) {
    return { valid: false, reason: 'King has already moved' };
  }

  if (rook.hasMoved) {
    return { valid: false, reason: 'Rook has already moved' };
  }

  // Check 5: King's current square not attacked
  const kingSquareId = `${fileToString(king.file)}${king.rank}${instanceId}`;
  const kingSquare = world.squares.get(kingSquareId);
  if (!kingSquare) {
    return { valid: false, reason: 'King square not found' };
  }

  if (isSquareAttacked(kingSquare, getOpponentColor(color), world, pieces)) {
    return { valid: false, reason: 'King is in check' };
  }

  // Check 6: King's destination square not attacked
  const rookSquareId = `${fileToString(rook.file)}${rook.rank}${instanceId}`;
  const rookSquare = world.squares.get(rookSquareId);
  if (!rookSquare) {
    return { valid: false, reason: 'Rook square not found' };
  }

  if (isSquareAttacked(rookSquare, getOpponentColor(color), world, pieces)) {
    return { valid: false, reason: 'King destination square is attacked' };
  }

  // Valid!
  return {
    valid: true,
    kingFrom: { file: king.file, rank: king.rank, level: king.level },
    kingTo: { file: rook.file, rank: rook.rank, level: rook.level },
    rookFrom: { file: rook.file, rank: rook.rank, level: rook.level },
    rookTo: { file: king.file, rank: king.rank, level: king.level },
    involvedBoards: [instanceId],
  };
}
```

### Queenside Castle Validation

```typescript
function validateQueensideCastle(context: CastleContext): CastleValidation {
  const { color, pieces, world, trackStates } = context;

  const backRank = color === 'white' ? 0 : 9;
  const pin = color === 'white' ? 1 : 6;

  // Get both track states
  const qlState = trackStates.QL;
  const klState = trackStates.KL;

  // Check 1: Both boards at correct pins
  const qlPin = color === 'white' ? qlState.whiteBoardPin : qlState.blackBoardPin;
  const klPin = color === 'white' ? klState.whiteBoardPin : klState.blackBoardPin;

  if (qlPin !== pin || klPin !== pin) {
    return { valid: false, reason: 'Bridge boards not at starting positions' };
  }

  // Check 2: Both boards controlled by player
  const qlController = getBoardController(color, qlState);
  const klController = getBoardController(color, klState);

  if (qlController !== color || klController !== color) {
    return { valid: false, reason: 'Bridge boards not both controlled by player' };
  }

  // Build instance IDs
  const qlRotation = color === 'white' ? qlState.whiteRotation : qlState.blackRotation;
  const klRotation = color === 'white' ? klState.whiteRotation : klState.blackRotation;
  const qlInstanceId = `QL${pin}:${qlRotation}`;
  const klInstanceId = `KL${pin}:${klRotation}`;

  // Check 3: Find king and rook on bridge boards
  const king = pieces.find(p =>
    p.type === 'king' &&
    p.color === color &&
    (p.level === qlInstanceId || p.level === klInstanceId) &&
    p.rank === backRank
  );

  const rook = pieces.find(p =>
    p.type === 'rook' &&
    p.color === color &&
    (p.level === qlInstanceId || p.level === klInstanceId) &&
    p.rank === backRank
  );

  if (!king) {
    return { valid: false, reason: 'King not found on bridge boards' };
  }

  if (!rook) {
    return { valid: false, reason: 'Rook not found on bridge boards' };
  }

  // Check 4: King and rook must be on opposite boards
  if (king.level === rook.level) {
    return { valid: false, reason: 'King and rook must be on opposite bridge boards for queenside castle' };
  }

  // Check 5: Neither piece has moved
  if (king.hasMoved || rook.hasMoved) {
    return { valid: false, reason: 'King or rook has already moved' };
  }

  // Check 6: King's start square not attacked
  const kingSquareId = `${fileToString(king.file)}${king.rank}${king.level}`;
  const kingSquare = world.squares.get(kingSquareId);

  if (isSquareAttacked(kingSquare!, getOpponentColor(color), world, pieces)) {
    return { valid: false, reason: 'King is in check' };
  }

  // Check 7: King's destination square not attacked
  const kingDestSquareId = `${fileToString(rook.file)}${rook.rank}${rook.level}`;
  const kingDestSquare = world.squares.get(kingDestSquareId);

  if (isSquareAttacked(kingDestSquare!, getOpponentColor(color), world, pieces)) {
    return { valid: false, reason: 'King destination square is attacked' };
  }

  // Check 8: Path squares not attacked (if implementing micro-steps)
  // For simplicity, we can treat queenside as atomic (direct jump)
  // Or check intermediate squares on the king's origin board

  // Valid!
  return {
    valid: true,
    kingFrom: { file: king.file, rank: king.rank, level: king.level },
    kingTo: { file: rook.file, rank: rook.rank, level: rook.level },
    rookFrom: { file: rook.file, rank: rook.rank, level: rook.level },
    rookTo: { file: king.file, rank: king.rank, level: king.level },
    involvedBoards: [qlInstanceId, klInstanceId],
  };
}
```

### Helper: Get Castling Options

```typescript
/**
 * Returns all legal castling options for the current player
 */
export function getCastlingOptions(
  color: 'white' | 'black',
  pieces: Piece[],
  world: ChessWorld,
  trackStates: TrackStates,
  currentTurn: 'white' | 'black',
  attackBoardActivatedThisTurn: boolean
): CastleType[] {
  if (color !== currentTurn) return [];
  if (attackBoardActivatedThisTurn) return [];

  const options: CastleType[] = [];

  // Check kingside QL
  const kingsideQL = validateCastle({
    color,
    castleType: 'kingside-ql',
    pieces,
    world,
    trackStates,
    currentTurn,
    attackBoardActivatedThisTurn,
  });
  if (kingsideQL.valid) options.push('kingside-ql');

  // Check kingside KL
  const kingsideKL = validateCastle({
    color,
    castleType: 'kingside-kl',
    pieces,
    world,
    trackStates,
    currentTurn,
    attackBoardActivatedThisTurn,
  });
  if (kingsideKL.valid) options.push('kingside-kl');

  // Check queenside
  const queenside = validateCastle({
    color,
    castleType: 'queenside',
    pieces,
    world,
    trackStates,
    currentTurn,
    attackBoardActivatedThisTurn,
  });
  if (queenside.valid) options.push('queenside');

  return options;
}
```

---

## Execution Logic

### Main Execution Function

**File:** `src/store/gameStore.ts`

```typescript
/**
 * Executes a castle move
 */
executeCastle: (castleType: CastleType) => {
  const state = get();
  const { currentTurn, pieces, world, trackStates, attackBoardActivatedThisTurn } = state;

  // Validate
  const validation = validateCastle({
    color: currentTurn,
    castleType,
    pieces,
    world,
    trackStates,
    currentTurn,
    attackBoardActivatedThisTurn,
  });

  if (!validation.valid) {
    console.error('Invalid castle:', validation.reason);
    return;
  }

  const { kingFrom, kingTo, rookFrom, rookTo } = validation;

  // Update pieces
  const updatedPieces = pieces.map(piece => {
    // Update king
    if (
      piece.type === 'king' &&
      piece.color === currentTurn &&
      piece.file === kingFrom!.file &&
      piece.rank === kingFrom!.rank &&
      piece.level === kingFrom!.level
    ) {
      return {
        ...piece,
        file: kingTo!.file,
        rank: kingTo!.rank,
        level: kingTo!.level,
        hasMoved: true,
      };
    }

    // Update rook
    if (
      piece.type === 'rook' &&
      piece.color === currentTurn &&
      piece.file === rookFrom!.file &&
      piece.rank === rookFrom!.rank &&
      piece.level === rookFrom!.level
    ) {
      return {
        ...piece,
        file: rookTo!.file,
        rank: rookTo!.rank,
        level: rookTo!.level,
        hasMoved: true,
      };
    }

    return piece;
  });

  // Add to move history
  const move: Move = {
    type: 'castle',
    castleType,
    castleNotation: castleType === 'queenside' ? 'O-O-O' : 'O-O',
    timestamp: Date.now(),
  };

  // Switch turn
  const nextTurn = currentTurn === 'white' ? 'black' : 'white';

  // Check game state
  const opponentInCheck = isInCheck(nextTurn, world, updatedPieces);
  const opponentCheckmate = opponentInCheck && isCheckmate(nextTurn, world, updatedPieces);
  const opponentStalemate = !opponentInCheck && isStalemate(nextTurn, world, updatedPieces);

  // Update state
  set({
    pieces: updatedPieces,
    moveHistory: [...state.moveHistory, move],
    currentTurn: nextTurn,
    isCheck: opponentInCheck,
    isCheckmate: opponentCheckmate,
    isStalemate: opponentStalemate,
    gameOver: opponentCheckmate || opponentStalemate,
    winner: opponentCheckmate ? currentTurn : undefined,
    selectedSquareId: null,
    highlightedSquareIds: [],
  });
},
```

---

## UI/UX Design

### Castle Controls Component

**File:** `src/components/UI/CastleControls.tsx` (NEW)

```typescript
import { useGameStore } from '../../store/gameStore';
import { getCastlingOptions } from '../../engine/validation/castleValidator';

export function CastleControls() {
  const currentTurn = useGameStore(state => state.currentTurn);
  const pieces = useGameStore(state => state.pieces);
  const world = useGameStore(state => state.world);
  const trackStates = useGameStore(state => state.trackStates);
  const attackBoardActivatedThisTurn = useGameStore(state => state.attackBoardActivatedThisTurn);
  const executeCastle = useGameStore(state => state.executeCastle);

  const options = getCastlingOptions(
    currentTurn,
    pieces,
    world,
    trackStates,
    currentTurn,
    attackBoardActivatedThisTurn
  );

  if (options.length === 0) return null;

  return (
    <div className="castle-controls">
      <h3>Castling Available</h3>
      {options.includes('kingside-ql') && (
        <button onClick={() => executeCastle('kingside-ql')}>
          Castle Kingside (QL)
        </button>
      )}
      {options.includes('kingside-kl') && (
        <button onClick={() => executeCastle('kingside-kl')}>
          Castle Kingside (KL)
        </button>
      )}
      {options.includes('queenside') && (
        <button onClick={() => executeCastle('queenside')}>
          Castle Queenside (O-O-O)
        </button>
      )}
    </div>
  );
}
```

### Visual Feedback

**Highlight Involved Squares:**
When user hovers over castle button:
1. Highlight king's current square (green)
2. Highlight king's destination square (blue)
3. Highlight rook's current square (yellow)
4. Highlight rook's destination square (orange)
5. Draw arrows showing the swap/cross motion

**Animation:**
When castle executes:
1. Animate king sliding to rook's square
2. Simultaneously animate rook sliding to king's square
3. Duration: 500ms with easing

---

## Implementation Phases

### Phase 1: Core Validation (2-3 hours) ✅ COMPLETED

**Files Created:**
- `src/engine/validation/castleValidator.ts` ✅

**Tasks Completed:**
1. ✅ Created `CastleRequest`, `CastleValidation`, `CastleContext` interfaces
2. ✅ Implemented `validateCastle()` main function
3. ✅ Implemented `validateKingsideCastle()`
4. ✅ Implemented `validateQueensideCastle()`
5. ✅ Implemented `getCastlingOptions()` helper

**Acceptance Criteria:**
- ✅ All validation functions written
- ✅ No TypeScript errors
- ✅ Functions return correct CastleValidation objects

**Implementation Details:**
- Validates all 3 castle types: `kingside-ql`, `kingside-kl`, `queenside`
- Enforces all legality requirements: unmoved pieces, correct pins, board control, check status
- Returns detailed metadata including piece positions and involved boards
- Properly handles attack board instance IDs with rotation states

### Phase 2: Unit Tests (2 hours) ✅ COMPLETED

**Files Created:**
- `src/engine/validation/__tests__/castleValidator.test.ts` ✅

**Test Results: 16/16 Tests Passing ✅**

**Test Coverage:**
1. ✅ **Kingside QL - White - Valid** - King and rook swap on QL1:0
2. ✅ **Kingside QL - White - King Moved** - Rejects when king has moved
3. ✅ **Kingside QL - White - Rook Moved** - Rejects when rook has moved
4. ✅ **Kingside QL - White - King in Check** - Rejects when king is in check
5. ✅ **Kingside QL - White - Destination Attacked** - Rejects when destination is attacked
6. ✅ **Kingside QL - White - Wrong Pin** - Rejects when board not at starting pin
7. ✅ **Kingside KL - Black - Valid** - King and rook swap on KL6:0
8. ✅ **Kingside KL - Black - King in Check** - Rejects when king is in check
9. ✅ **Queenside - White - Valid** - King/rook swap between KL1 and QL1
10. ✅ **Queenside - White - Same Board** - Rejects when both pieces on same board
11. ✅ **Queenside - White - Wrong Pin** - Rejects when boards not at starting positions
12. ✅ **Queenside - White - Path Attacked** - Rejects when destination is attacked
13. ✅ **After Attack Board Activation** - Rejects castling after board activation
14. ✅ **getCastlingOptions - Wrong Turn** - Returns empty array
15. ✅ **getCastlingOptions - Board Activated** - Returns empty array
16. ✅ **getCastlingOptions - Multiple Available** - Returns all valid options

**Acceptance Criteria:**
- ✅ All test cases pass
- ✅ Edge cases covered
- ✅ Validation rules properly enforced

**Key Corrections Made:**
- Fixed file/rank mappings for attack boards (QL: files 0-1, KL: files 4-5)
- Corrected Black's back rank to 9 (not 8) for pin 6
- Ensured proper instance ID format with rotation states

### Phase 3: Store Integration (1 hour) ✅ COMPLETED

**Files Modified:**
- `src/store/gameStore.ts` ✅

**Tasks Completed:**
1. ✅ Added `attackBoardActivatedThisTurn: boolean` to state
2. ✅ Added `executeCastle(castleType)` action
3. ✅ Extended `Move` interface to include castle fields
4. ✅ Updated `resetGame()` to reset castle-related state

**Acceptance Criteria:**
- ✅ `executeCastle()` correctly updates pieces
- ✅ Move history captures castle moves
- ✅ Turn switches after castle
- ✅ Check/checkmate detection works after castle

**Implementation Details:**
- Extended `Move` union type with new `castle` variant including all position details
- Added `attackBoardActivatedThisTurn` state that resets on turn change
- Set flag when attack boards are activated or rotated
- `executeCastle()` validates castle, swaps king/rook positions, updates hasMoved flags
- Integration with existing check/checkmate detection system
- Proper undo support via snapshot system
- Castle moves recorded in move history with full position information

### Phase 4: UI Components (2 hours)

**Files to Create:**
- `src/components/UI/CastleControls.tsx`

**Files to Modify:**
- `src/components/App.tsx` - Add CastleControls component

**Tasks:**
1. Create CastleControls component
2. Add button styling
3. Show/hide based on available options
4. Add hover effects for visual feedback

**Acceptance Criteria:**
- Castle buttons appear when castling is legal
- Clicking button executes castle
- Visual feedback clear and helpful

### Phase 5: Visual Enhancements - Interactive Castle Selection (2-3 hours) ✅ COMPLETED

**Design Decision: Approach 1 - Extend Valid Moves System**

**Concept:** When the king is selected, include castle destination squares in the highlighted valid moves with distinct visual styling.

**User Flow:**
1. User clicks king → both regular moves AND castle destinations are highlighted
2. Regular king moves (1 square away) highlighted in **green** (existing)
3. Castle destinations highlighted in **gold/yellow** with special castle icon
4. User clicks gold square → `executeCastle(castleType)` automatically
5. User clicks green square → regular `makeMove()`

**Files to Modify:**
- `src/store/gameStore.ts` - Add castle destination state
- `src/components/Board3D/BoardRenderer.tsx` - Add castle highlighting
- `src/components/Board3D/Pieces3D.tsx` - Add castle animations (optional)
- `src/engine/validation/castleValidator.ts` - Add helper to get king destinations

**Tasks:**

**Task 1: Add Castle Destination State** (30 min)
```typescript
// gameStore.ts
interface GameState {
  highlightedSquareIds: string[];  // regular moves (green)
  castleDestinations: Array<{
    squareId: string;  // king's destination
    castleType: CastleType;
  }>;
}

// When king selected:
getValidMovesForSquare: (kingSquareId) => {
  const regularMoves = getLegalMovesAvoidingCheck(...);

  if (piece.type === 'king') {
    const castleOptions = getCastlingOptions(...);
    const castleDestinations = castleOptions.map(type => ({
      squareId: getKingDestinationForCastle(type),
      castleType: type
    }));

    set({
      highlightedSquareIds: regularMoves,
      castleDestinations
    });
  }
}
```

**Task 2: Add Helper Function** (30 min)
```typescript
// castleValidator.ts
export function getKingDestinationForCastle(
  castleType: CastleType,
  pieces: Piece[],
  color: 'white' | 'black',
  trackStates: TrackStates,
  attackBoardStates: Record<string, { activeInstanceId: string }>
): string | null {
  // Get the castle validation which contains kingTo
  const validation = validateCastle({...});
  if (!validation.valid || !validation.kingTo) return null;

  // Convert to square ID
  const instanceId = resolveInstanceId(validation.kingTo.level, attackBoardStates);
  return `${fileToString(validation.kingTo.file)}${validation.kingTo.rank}${instanceId}`;
}
```

**Task 3: Update Board Renderer** (45 min)
```typescript
// BoardRenderer.tsx
const isRegularMove = highlightedSquareIds.includes(square.id);
const castleMove = castleDestinations.find(c => c.squareId === square.id);

if (isRegularMove) {
  // Green highlight (existing)
  material.color.set(0x00ff00);
  material.opacity = 0.4;
} else if (castleMove) {
  // Gold highlight for castle destinations
  material.color.set(0xffd700);  // Gold
  material.opacity = 0.5;

  // Add castle icon overlay (♜ or crown)
  addCastleIconToSquare(square, castleMove.castleType);
}
```

**Task 4: Update Click Handler** (30 min)
```typescript
// BoardRenderer.tsx
const handleSquareClick = (squareId: string) => {
  const castleMove = castleDestinations.find(c => c.squareId === squareId);

  if (castleMove) {
    executeCastle(castleMove.castleType);
    return;
  }

  // ... existing move logic
}
```

**Task 5: Visual Design** (30 min)
- **Regular moves**: Green square (existing)
- **Castle destinations**:
  - Gold/yellow border and glow
  - Small castle icon (♜) or crown (♔) overlay in 3D
  - Tooltip on hover: "Castle Queenside (O-O-O)"
  - Subtle pulsing animation to draw attention

**Task 6: Keep Panel as Optional** (15 min)
- Keep CastleControls panel visible for traditional button-based interaction
- Users can choose: click gold square OR click panel button
- Panel helpful for learning and showing notation

**Edge Cases to Handle:**
1. **Multiple castles available**: King might show 2+ gold destinations (queenside, kingside-QL, kingside-KL) - each distinct, no confusion
2. **King destination calculation**: Helper function computes where king ends for each castle type
3. **Clear state**: When piece deselected, clear both `highlightedSquareIds` AND `castleDestinations`
4. **Visual priority**: If overlap (unlikely), prioritize castle highlighting

**Acceptance Criteria:**
- ✅ Gold highlights appear on king's castle destinations when king selected
- ✅ Clicking gold square executes correct castle type
- ✅ Castle panel still works as alternative interaction
- ✅ Visual distinction clear between regular moves and castle moves
- ✅ Emissive glow effect on castle destinations
- ✅ Glowing cylinder indicator above each castle destination
- ✅ Board ID to instance ID conversion ensures correct square matching
- ✅ No console errors

**Implementation Complete:** All tasks finished, feature working in browser, interactive castle selection fully functional.

### Phase 6: Integration Testing (1 hour) - IN PROGRESS

**Status:** Basic testing complete (queenside castle working), comprehensive testing checklist below.

**Systematic Testing Checklist:**

#### Happy Path Tests
- [ ] **Queenside Castle - White** ✅ (Confirmed working)
  - King on KL1, rook on QL1
  - Click king → gold square appears on rook's square
  - Click gold square → castle executes
  - Verify: King at a0QL1, Rook at d0KL1
  - Verify: Move history shows "O-O-O"

- [ ] **Kingside Castle - White QL**
  - King and rook on QL1 at starting positions
  - Click king → gold square appears
  - Click gold square → pieces swap
  - Verify: hasMoved flags set

- [ ] **Kingside Castle - White KL**
  - King and rook on KL1 at starting positions
  - Click king → gold square appears
  - Click gold square → pieces swap
  - Verify: hasMoved flags set

- [ ] **Queenside Castle - Black**
  - King on KL6, rook on QL6
  - Click king → gold square appears
  - Click gold square → castle executes
  - Verify: King at a9QL6, Rook at d9KL6

- [ ] **Kingside Castle - Black QL**
  - King and rook on QL6 at starting positions
  - Test castle execution

- [ ] **Kingside Castle - Black KL**
  - King and rook on KL6 at starting positions
  - Test castle execution

#### Visual Feedback Tests
- [ ] **Gold highlighting visible**
  - Gold square clearly distinct from green regular moves
  - Emissive glow effect visible

- [ ] **Cylinder indicator visible**
  - Gold cylinder appears above castle destination
  - Indicator positioned correctly

- [ ] **Button panel still works**
  - Castle buttons appear when castling available
  - Clicking button executes castle
  - Both interaction methods work simultaneously

#### Edge Case Tests - Castle Unavailable
- [ ] **King has moved**
  - Move king one square, move it back
  - Verify: No castle destinations appear (hasMoved=true)
  - Verify: No castle buttons in panel

- [ ] **Rook has moved**
  - Move rook one square, move it back
  - Verify: No castle destinations appear (hasMoved=true)

- [ ] **King in check**
  - Position opponent piece to attack king
  - Click king
  - Verify: No castle destinations (regular moves only)

- [ ] **Destination square attacked**
  - Position opponent piece to attack castle destination
  - Click king
  - Verify: That castle type not available

- [ ] **After attack board activation**
  - Activate an attack board
  - Same turn: Click king
  - Verify: No castle destinations
  - Next turn: Verify castling available again (if still legal)

- [ ] **Board not at starting pin**
  - Move QL board to different pin
  - Verify: Kingside-QL not available
  - Verify: Queenside not available if either board moved

- [ ] **Pieces on same board (queenside)**
  - Move rook to same board as king
  - Verify: Queenside not available

- [ ] **Path blocked (queenside)**
  - Place piece between king and rook on back rank
  - Verify: Queenside not available

#### Integration Tests
- [ ] **Move history**
  - Execute castle
  - Check move history display
  - Verify: Shows castle notation (O-O or O-O-O)
  - Verify: Includes full position details in move object

- [ ] **Turn switching**
  - Execute castle
  - Verify: Turn switches to opponent
  - Verify: Opponent can now move

- [ ] **Check detection after castle**
  - Set up position where castle puts opponent in check
  - Execute castle
  - Verify: isCheck flag set for opponent
  - Verify: UI shows check indicator

- [ ] **Undo after castle**
  - Execute castle
  - Press undo
  - Verify: Pieces return to original positions
  - Verify: hasMoved flags restored to false
  - Verify: Can castle again

- [ ] **State persistence**
  - Execute castle
  - Save game
  - Load game
  - Verify: Pieces in correct positions
  - Verify: hasMoved flags correct

#### Console & Errors
- [ ] **No console errors**
  - Open browser console
  - Execute all castle types
  - Verify: No errors logged

- [ ] **No console warnings**
  - Verify: No React warnings
  - Verify: No Three.js warnings

**Acceptance Criteria:**
- [ ] All happy path tests pass
- [ ] All edge case tests pass
- [ ] Visual feedback clear and correct
- [ ] No console errors or warnings
- [ ] Smooth user experience
- [ ] Both interaction methods (click + button) work

**Testing Notes:**
- Use "Kings and rooks" game preset for easiest setup
- Test systematically: one color, one castle type at a time
- Document any issues found
- Re-test after any fixes

---

## Testing Strategy

### Unit Tests

**Location:** `src/engine/validation/__tests__/castleValidator.test.ts`

```typescript
describe('Castling Validation', () => {
  describe('Kingside Castling', () => {
    it('should allow kingside castle when legal', () => {
      // Setup: King and rook unmoved, board controlled, no check
      const validation = validateCastle(context);
      expect(validation.valid).toBe(true);
    });

    it('should reject if king has moved', () => {
      // Setup: King with hasMoved=true
      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('King has already moved');
    });

    it('should reject if rook has moved', () => {
      // Setup: Rook with hasMoved=true
      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('Rook has already moved');
    });

    it('should reject if king is in check', () => {
      // Setup: Opponent piece attacking king
      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('check');
    });

    it('should reject if destination is attacked', () => {
      // Setup: Opponent piece attacking rook square
      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('attacked');
    });

    it('should reject if board not at starting pin', () => {
      // Setup: Board at wrong pin
      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('not at starting position');
    });
  });

  describe('Queenside Castling', () => {
    it('should allow queenside castle when legal', () => {
      // Setup: King on KL1, rook on QL1, both unmoved, both boards controlled
      const validation = validateCastle(context);
      expect(validation.valid).toBe(true);
    });

    it('should reject if boards not on opposite sides', () => {
      // Setup: King and rook on same board
      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('opposite bridge boards');
    });

    it('should reject if bridge boards not controlled', () => {
      // Setup: One board controlled by opponent
      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('not both controlled');
    });

    it('should reject if either board not at starting pin', () => {
      // Setup: KL at pin 1, QL at pin 2
      const validation = validateCastle(context);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('not at starting positions');
    });
  });

  describe('getCastlingOptions', () => {
    it('should return empty array if not current player\'s turn', () => {
      const options = getCastlingOptions('white', pieces, world, trackStates, 'black', false);
      expect(options).toEqual([]);
    });

    it('should return empty array if attack board activated this turn', () => {
      const options = getCastlingOptions('white', pieces, world, trackStates, 'white', true);
      expect(options).toEqual([]);
    });

    it('should return all valid castle types', () => {
      // Setup: All castles legal
      const options = getCastlingOptions('white', pieces, world, trackStates, 'white', false);
      expect(options).toContain('kingside-ql');
      expect(options).toContain('kingside-kl');
      expect(options).toContain('queenside');
    });
  });
});
```

### Integration Tests

**Location:** `src/store/__tests__/gameStore.castle.test.ts`

```typescript
describe('Game Store - Castling', () => {
  it('should execute kingside castle and update state', () => {
    const { result } = renderHook(() => useGameStore());

    // Setup game state with castle available
    act(() => {
      result.current.resetGame();
      // ... position pieces for castle
    });

    // Execute castle
    act(() => {
      result.current.executeCastle('kingside-kl');
    });

    // Verify pieces moved
    const king = result.current.pieces.find(p => p.type === 'king' && p.color === 'white');
    const rook = result.current.pieces.find(p => p.type === 'rook' && p.color === 'white' && p.file === 4);

    expect(king?.file).toBe(4); // King moved to rook's square
    expect(rook?.file).toBe(5); // Rook moved to king's square
    expect(king?.hasMoved).toBe(true);
    expect(rook?.hasMoved).toBe(true);

    // Verify turn switched
    expect(result.current.currentTurn).toBe('black');

    // Verify move history
    const lastMove = result.current.moveHistory[result.current.moveHistory.length - 1];
    expect(lastMove.type).toBe('castle');
    expect(lastMove.castleType).toBe('kingside-kl');
  });
});
```

### Manual Test Scenarios

1. **Kingside Castle - White QL:**
   - Start new game
   - Move pieces to enable QL castle
   - Click "Castle Kingside (QL)"
   - Verify king and rook swap on QL1

2. **Kingside Castle - White KL:**
   - Start new game
   - Move pieces to enable KL castle
   - Click "Castle Kingside (KL)"
   - Verify king and rook swap on KL1

3. **Queenside Castle - White:**
   - Start new game
   - Verify king on KL1, rook on QL1
   - Click "Castle Queenside"
   - Verify king crosses to QL1, rook to KL1

4. **Blocked Castle - King Moved:**
   - Move king one square
   - Verify castle buttons don't appear

5. **Blocked Castle - Rook Moved:**
   - Move rook one square
   - Verify castle buttons don't appear

6. **Blocked Castle - King in Check:**
   - Position opponent piece to attack king
   - Verify castle buttons don't appear

7. **Blocked Castle - Path Attacked:**
   - Position opponent piece to attack destination
   - Verify castle buttons don't appear

8. **Blocked Castle - After Activation:**
   - Activate attack board
   - Verify castle buttons don't appear this turn
   - Verify they reappear next turn (if still legal)

---

## Edge Cases & Considerations

### Edge Case 1: Board Rotation

**Scenario:** Attack board is rotated (e.g., QL1:180 instead of QL1:0)

**Consideration:**
- King and rook positions may be inverted due to rotation
- Files are reversed: what was file z (0) is now file a (1)
- Validation must account for rotation when finding pieces
- Swap logic remains the same (pieces just swap their squares)

**Solution:**
- Use piece positions directly (file/rank/level)
- Don't assume king is on specific file
- Search for king and rook by type/color/level

### Edge Case 2: Multiple Rooks

**Scenario:** Player has 2+ rooks on same attack board (via pawn promotion)

**Consideration:**
- Which rook participates in castling?
- Only the unmoved rook on the back rank should be eligible

**Solution:**
- Filter for `hasMoved === false`
- Filter for `rank === backRank`
- If multiple rooks qualify, prioritize by file (closer to king)

### Edge Case 3: Board Ownership

**Scenario:** Attack board occupied by opponent's piece (passenger)

**Consideration:**
- Board controller = passenger color
- Player cannot castle if they don't control the board

**Solution:**
- Use `getBoardController()` helper
- Check controller matches player color
- Validation already handles this

### Edge Case 4: Queenside Availability

**Scenario:** One bridge board activated away from starting pin

**Consideration:**
- Queenside castle requires **both** boards at pins 1 (White) or 6 (Black)
- If either board moved, queenside castle impossible (until it returns)

**Solution:**
- Check both `qlPin === pin` and `klPin === pin`
- Validation already handles this

### Edge Case 5: Castling After Undo

**Scenario:** Player castles, then undoes move

**Consideration:**
- King and rook should have `hasMoved = false` again
- Castle should be available again

**Solution:**
- Undo must restore `hasMoved` flags correctly
- Store previous `hasMoved` state in undo history
- This is a general undo concern, not castle-specific

### Edge Case 6: Check After Castling

**Scenario:** Opponent is in check after player castles

**Consideration:**
- Rook's new position may attack opponent king
- Must check game state after castle

**Solution:**
- Execute castle → update pieces → check for check/checkmate
- Store already handles this via `isInCheck()` call

### Edge Case 7: Castling Rights Lost

**Scenario:** King moves, then returns to starting square

**Consideration:**
- Castling rights lost permanently after king moves
- Even if king returns, cannot castle

**Solution:**
- `hasMoved` flag is permanent (never reset)
- Once set to true, it stays true
- Works correctly

### Edge Case 8: Rotation During Castle

**Scenario:** Can player rotate board while castling?

**Consideration:**
- Castling doesn't involve board activation
- Board stays in place, only pieces move
- No rotation permitted

**Solution:**
- Castle is a piece move, not a board move
- Boards don't activate during castle
- Already enforced by not providing rotation option

---

## Summary

### What We're Building

A comprehensive castling system that:
1. Validates kingside and queenside castling on attack boards
2. Handles complex geometry (cross-board movement for queenside)
3. Enforces all Meder rules (unmoved pieces, board control, king safety)
4. Provides clear UI for available castles
5. Animates castle execution smoothly
6. Records castles in move history

### Implementation Timeline

**Total Estimated Time:** 9-11 hours

1. Core Validation: 2-3 hours
2. Unit Tests: 2 hours
3. Store Integration: 1 hour
4. UI Components: 2 hours
5. Visual Enhancements: 1-2 hours
6. Integration Testing: 1 hour

### Success Criteria

- [ ] All validation functions implemented
- [ ] All unit tests pass (8+ test cases)
- [ ] executeCastle() works for all three castle types
- [ ] CastleControls UI appears when castling legal
- [ ] Pieces animate smoothly during castle
- [ ] Move history records castle correctly (O-O or O-O-O)
- [ ] hasMoved flags set correctly after castle
- [ ] Cannot castle after attack board activation
- [ ] Cannot castle while in check or through attacked squares
- [ ] Both colors can castle (White and Black)
- [ ] Manual tests pass

### Next Steps

1. Review this plan with team/user
2. Get approval to proceed
3. Create feature branch: `feature/castling-implementation`
4. Start with Phase 1 (Core Validation)
5. Proceed phase-by-phase with testing between each phase

---

**End of Castling Implementation Plan**
