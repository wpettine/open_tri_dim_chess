# 3D Chess (Raumschach) - Complete Design Document

## Executive Summary

Build a web-based 3D chess game with seven boards (3 main levels + 4 movable attack boards) using React, Three.js, and TypeScript. The architecture uses a **world grid system** as the single source of truth for all positions, avoiding coordinate transformation bugs. The game features beautiful 3D graphics, custom chess piece models, comprehensive test coverage, and an intuitive UI.

## ⚠️ CRITICAL DESIGN PHILOSOPHY

**This document is REQUIREMENT-DRIVEN, not COORDINATE-PRESCRIPTIVE.**

Previous implementation had an unsolvable bug: attack boards rendered at wrong positions because:
- Board squares and pieces used different coordinate formulas
- Exact coordinates were hardcoded without visual validation
- Tests passed but pieces didn't align with squares visually

**This document DOES NOT prescribe exact coordinate values.** Instead, it provides:
1. **Requirements**: What the coordinate system must achieve
2. **Validation tests**: How to verify it's correct
3. **Debug tools**: How to visualize and fix alignment issues
4. **Anti-patterns**: The specific mistakes that caused the original bug

**As an AI agent, you must:**
- Derive coordinate formulas from requirements, not copy from examples
- Validate visually before proceeding to game logic
- Use the SAME coordinate function for squares and pieces
- Create debug visualizers to see what's actually rendering

The examples in this document are illustrative. The validation tests are prescriptive. Follow the tests, not the examples.

---

## Part 1: Game Rules & Mechanics

### 1.1 Board Layout

**IMPORTANT: Use visual reference diagrams to determine exact positions!**

The Meder rules specify board layout conceptually, but the exact 3D positioning must be determined through visual alignment. Reference the physical diagrams (piece_coordinates_1.png, piece_coordinates_2.png if available) to understand the intended spatial relationships.

**Main Boards (Static):**
- **White Level (WL)**: 4×4 board, files a-d, ranks 2-5
- **Neutral Level (NL)**: 4×4 board, files a-d, ranks 4-7 (overlaps with WL and BL)
- **Black Level (BL)**: 4×4 board, files a-d, ranks 6-9

**Attack Boards (Movable):**
- **White Queen Level (WQL)**: 2×2 board, starts behind white's main board
- **White King Level (WKL)**: 2×2 board, starts behind white's main board
- **Black Queen Level (BQL)**: 2×2 board, starts behind black's main board
- **Black King Level (BKL)**: 2×2 board, starts behind black's main board

**File Convention:**
- 0 = 'z' (attack board exclusive files)
- 1 = 'a' (main board left edge)
- 2 = 'b'
- 3 = 'c'
- 4 = 'd' (main board right edge)
- 5 = 'e' (attack board exclusive files)

**Coordinate System:**
- Files: 0-5 (z, a, b, c, d, e)
- Ranks: 0-9 (continuous across all boards)
- Levels: Board IDs (WL, NL, BL, WQL, WKL, BQL, BKL)

**CRITICAL REQUIREMENT:** The rank numbering MUST be continuous from 0-9. Attack boards at white's end use lower ranks, attack boards at black's end use higher ranks.

### 1.2 Initial Piece Setup

**White Main Level (WL):**
- Rank 2: Pawns at a2, b2, c2, d2
- Rank 3: Rook-a3, Knight-b3, Bishop-c3, Rook-d3
- Rank 4: empty
- Rank 5: Knight-a5, Queen-b5, King-c5, Bishop-d5

**Black Main Level (BL):**
- Rank 6: Knight-a6, Queen-b6, King-c6, Bishop-d6
- Rank 7: empty
- Rank 8: Rook-a8, Knight-b8, Bishop-c8, Rook-d8
- Rank 9: Pawns at a9, b9, c9, d9

**White Attack Boards:**
- WQL (z0-a1): Pawn-z0, Rook-a0, Pawn-z1, Rook-a1
- WKL (d0-e1): Rook-d0, Pawn-e0, Rook-d1, Pawn-e1

**Black Attack Boards:**
- BQL (z8-a9): Pawn-z8, Rook-a8, Pawn-z9, Rook-a9
- BKL (d8-e9): Rook-d8, Pawn-e8, Rook-d9, Pawn-e9

### 1.3 Piece Movement Rules

**Standard Movements:**
- **Pawn**: Forward 1 (or 2 from start), captures diagonally, promotes on opposite attack board
- **Rook**: Straight lines (any axis)
- **Knight**: L-shape (2+1 in any planar combination)
- **Bishop**: Diagonals (in any 2D plane)
- **Queen**: Rook + Bishop combined
- **King**: 1 square in any direction

**3D Movement Details:**
- Pieces can move between levels vertically
- Diagonals work in XY, XZ, and YZ planes
- Knights can jump in 3D space (e.g., 2 files + 1 level)

**Special Rules:**
- No castling
- No en passant
- Pawn promotion on reaching opposite attack board

### 1.4 Attack Board Movement

**Rules:**
- Can move if holding ≤1 piece
- Controlled by player whose piece is on it (empty = original owner)
- Moves like a rook to adjacent pins only
- Empty boards can move to inverted pins
- Occupied boards cannot move backward or to inverted pins
- Pieces move WITH the board (passengers)

**Pin Positions:**
Each level has 3-5 pins arranged in 3D space. Pins are pre-defined positions where 2×2 attack boards can dock.

---

## Part 2: Architecture & Technology Stack

### 2.1 Technology Stack

**Frontend:**
- React 18+ (with TypeScript)
- Three.js + @react-three/fiber + @react-three/drei
- Zustand (state management)
- Vite (build tool)

**Testing:**
- Vitest
- @testing-library/react

**3D Models:**
- GLTF format for chess pieces
- Use free models from Sketchfab or Poly Haven
- License: CC-BY or CC0

### 2.2 Core Architecture Principle: World Grid System

**CRITICAL DESIGN DECISION:**

The architecture uses a **world grid** as the single source of truth for all positions. This eliminates coordinate transformation bugs.

**Key Concept:**
- Pre-compute ALL square positions once during initialization
- Store world coordinates (X, Y, Z) directly in each square
- Rendering components simply READ positions, never calculate them
- No coordinate transformations at render time

**Data Structure:**

```typescript
interface WorldSquare {
  id: string;                    // "a2WL", "z0WQL"
  boardId: string;               // "WL", "WQL"
  file: number;                  // 0-5
  rank: number;                  // 0-9
  level: string;                 // Board ID
  worldX: number;                // Three.js X coordinate
  worldY: number;                // Three.js Y coordinate
  worldZ: number;                // Three.js Z coordinate
  isValid: boolean;
  color: 'light' | 'dark';
}

interface BoardLayout {
  id: string;
  type: 'main' | 'attack';
  size: { width: number; height: number };
  currentPin?: string;           // For attack boards
  canMove: boolean;
  centerX: number;
  centerY: number;
  centerZ: number;
  rotation: number;              // 0 or 180 degrees
}

interface ChessWorld {
  squares: Map<string, WorldSquare>;      // Key: square ID
  boards: Map<string, BoardLayout>;       // Key: board ID
  pins: Map<string, PinPosition>;         // Key: pin ID
}
```

### 2.3 World Coordinate Mapping

**DO NOT HARDCODE THESE FORMULAS - DERIVE THEM FROM REQUIREMENTS!**

The coordinate mapping must satisfy these requirements:

**Requirements:**
1. **Consistency**: Same formula for all boards (no special cases)
2. **Alignment**: Piece position MUST equal square position when piece is on that square
3. **Spacing**: Squares should be evenly spaced with small gaps (visual preference)
4. **Continuity**: Rank N should have same worldY on all boards it appears on

**General Formula Pattern:**
```
worldX = f(file) + offsetX
worldY = g(rank) + offsetY  
worldZ = board.zHeight
```

Where f() and g() are linear functions that maintain consistent spacing.

**Design Approach:**
1. Start with simple linear mapping (e.g., `worldY = rank * spacing`)
2. Test with visual rendering to verify alignment
3. Adjust centering offsets if needed
4. Validate that pieces and squares align perfectly

**Key Principle:** The SAME coordinate function must be used for:
- Placing board squares during world creation
- Placing pieces during rendering
- Calculating valid move positions

**Anti-Pattern:** Do NOT use different coordinate systems for boards vs pieces, or for different board types. This causes alignment bugs.

### 2.4 Game State Structure

```typescript
interface Piece {
  id: string;
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
  file: number;
  rank: number;
  level: string;
  hasMoved: boolean;
  movedAsPassenger?: boolean;  // Moved via attack board
}

interface GameState {
  world: ChessWorld;
  pieces: Piece[];
  currentTurn: 'white' | 'black';
  moveHistory: Move[];
  selectedSquareId?: string;
  highlightedSquareIds: string[];
  check?: 'white' | 'black';
  checkmate?: 'white' | 'black';
  stalemate: boolean;
}
```

**IMPORTANT:** Store world in game state. Pieces reference squares by ID. Rendering looks up positions in world grid.

---

## Part 3: Visual Design & Aesthetics

### 3.1 Color Scheme

**Board Theme:**
```typescript
const BOARD_THEME = {
  squares: {
    light: '#F0D9B5',    // Cream
    dark: '#B58863',     // Brown
    opacity: 0.9,
  },
  platforms: {
    main: '#8B4513',     // Saddle brown
    attack: '#A0522D',   // Sienna
    opacity: 0.7,
  },
  highlights: {
    selected: '#FFD700', // Gold
    validMove: '#90EE90', // Light green
    check: '#FF6347',    // Tomato red
  }
};
```

**Scene:**
- Background: Dark gradient (#1a1a2e to #16213e)
- Ambient light: 0.6 intensity
- Directional light: 0.8 intensity, position [10, 10, 10]
- Fog: Optional, for depth

### 3.2 3D Models

**Chess Pieces:**
- Use GLTF models with textures
- Scale: ~0.8 units tall for pawns, ~1.2 for kings
- Material: Standard material with metallic/roughness
- Colors: White pieces (#f5f5f5), Black pieces (#2c2c2c)

**Board Elements:**
- Squares: 1.9×1.9×0.1 boxes (slight gap between squares)
- Platforms: Rounded edges, 0.3 units thick
- Pin indicators: Small cylinders or spheres at pin locations

### 3.3 Camera Setup

**Initial Position:**
- Position: [0, -15, 20]
- LookAt: [0, 8, 5] (center of play area)
- FOV: 50°

**Controls:**
- Orbit controls (mouse drag to rotate)
- Zoom: Mouse wheel (min: 5, max: 50)
- Pan: Right-click drag
- Auto-rotate: Optional, slow (0.2 rpm)

### 3.4 Animations

**Piece Movement:**
- Duration: 300ms
- Easing: easeInOutCubic
- Path: Straight line with slight arc (Y + 1)

**Board Movement:**
- Duration: 500ms
- Easing: easeInOutQuad
- Pieces move with board (synchronized)

**Hover Effects:**
- Scale piece by 1.1
- Highlight square with glow
- Change cursor to pointer

---

## Part 4: File Structure

```
tri-dim-chess/
├── src/
│   ├── engine/
│   │   ├── world/
│   │   │   ├── types.ts              # World grid types
│   │   │   ├── worldBuilder.ts       # Initialize world
│   │   │   ├── worldMutation.ts      # Attack board movement
│   │   │   ├── pinPositions.ts       # Pin data
│   │   │   └── __tests__/
│   │   │       └── worldGridValidation.test.ts
│   │   ├── rules/
│   │   │   ├── moveValidation.ts     # Piece move validation
│   │   │   ├── checkDetection.ts     # Check/checkmate
│   │   │   ├── directionHelpers.ts   # Movement directions
│   │   │   └── __tests__/
│   │   │       ├── pawnMovement.test.ts
│   │   │       ├── rookMovement.test.ts
│   │   │       ├── knightMovement.test.ts
│   │   │       ├── bishopMovement.test.ts
│   │   │       ├── queenMovement.test.ts
│   │   │       ├── kingMovement.test.ts
│   │   │       └── checkDetection.test.ts
│   │   ├── gameEngine.ts             # Core game logic
│   │   ├── initialSetup.ts           # Starting position
│   │   ├── types.ts                  # Game types
│   │   └── constants.ts              # Constants
│   ├── components/
│   │   ├── Board3D/
│   │   │   ├── Board3D.tsx           # Main 3D scene
│   │   │   ├── BoardRenderer.tsx     # Render boards
│   │   │   ├── Pieces3D.tsx          # Render pieces
│   │   │   ├── ChessPieceModel.tsx   # Load GLTF models
│   │   │   ├── ValidMoveIndicators.tsx
│   │   │   ├── CameraController.tsx
│   │   │   └── PinIndicators.tsx
│   │   ├── UI/
│   │   │   ├── GameControls.tsx      # New game, undo, etc.
│   │   │   ├── GameStatus.tsx        # Turn, check, etc.
│   │   │   └── MoveHistory.tsx       # List of moves
│   │   └── Game/
│   │       └── Game.tsx              # Main game component
│   ├── store/
│   │   └── gameStore.ts              # Zustand store
│   ├── config/
│   │   └── theme.ts                  # Visual constants
│   ├── utils/
│   │   └── notation.ts               # Chess notation helpers
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   └── models/
│       └── chess/
│           ├── pawn.gltf
│           ├── rook.gltf
│           ├── knight.gltf
│           ├── bishop.gltf
│           ├── queen.gltf
│           └── king.gltf
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## Part 5: Implementation Steps

### Phase 1: Project Setup & World Grid Foundation

**Step 1: Initialize Project**
```bash
npm create vite@latest tri-dim-chess -- --template react-ts
cd tri-dim-chess
npm install three @react-three/fiber @react-three/drei zustand
npm install -D vitest @testing-library/react @types/three
```

**Step 2: Create World Grid System**

1. Create `src/engine/world/types.ts` with WorldSquare, BoardLayout, ChessWorld interfaces
2. Create `src/engine/world/pinPositions.ts` with all 24 pin definitions
3. Create `src/engine/world/worldBuilder.ts`:
   - `createChessWorld()` function
   - `createMainBoard()` helper
   - `createAttackBoard()` helper
   - Pre-compute all square positions

**Step 3: Write World Grid Tests**

Create `src/engine/world/__tests__/worldGridValidation.test.ts`:
- Test all squares have valid positions
- Test board centers are correct
- Test pin positions are defined
- Test square IDs are unique

### Phase 2: VALIDATION FIRST (Critical!)

**Step 4: Create Debug Visualizer**

Create `src/components/Debug/WorldGridVisualizer.tsx`:
- Render all squares as wireframes
- Label each square with its ID
- Log all coordinates to console

**Step 5: Run Validation Tests**

Create `src/engine/world/__tests__/coordinateValidation.test.ts`:
- Test rank continuity
- Test even spacing
- Test alignment
- Run these tests and FIX any failures before proceeding

**Step 6: Visual Validation**

- Render debug visualizer
- Verify squares appear at sensible positions
- Check that rank 0 is at bottom, rank 9 at top
- Verify files z-e are left to right
- Adjust coordinate formulas if needed

**DO NOT PROCEED TO PHASE 3 UNTIL COORDINATES ARE VALIDATED!**

### Phase 3: Initial Piece Setup & Game State

**Step 7: Create Game Types**

Create `src/engine/types.ts`:
- Piece interface
- GameState interface
- Move interface
- Color, PieceType enums

**Step 8: Create Initial Setup**

Create `src/engine/initialSetup.ts`:
- `createInitialPieces()` function
- Place all 64 pieces in starting positions
- Use world grid to validate positions

**Step 9: Create Game Store**

Create `src/store/gameStore.ts`:
- Initialize with world and pieces
- Actions: selectSquare, movePiece, resetGame
- Selectors for UI

### Phase 4: Basic Rendering

**Step 10: Create Scene Setup**

Create `src/components/Board3D/Board3D.tsx`:
- Canvas with camera position
- Lighting (ambient + directional)
- OrbitControls
- Background color

**Step 11: Render Boards**

Create `src/components/Board3D/BoardRenderer.tsx`:
- Map over world.boards
- Render platform mesh at board center
- Render squares at absolute positions from world grid
- Apply rotation to platform only (not squares)

**Step 12: Load 3D Models**

Create `src/components/Board3D/ChessPieceModel.tsx`:
- Use useGLTF hook
- Cache models
- Apply materials based on color

**Step 13: Render Pieces**

Create `src/components/Board3D/Pieces3D.tsx`:
- Map over pieces
- Look up square position from world grid
- Render ChessPieceModel at worldX, worldY, worldZ + 0.5
- Add hover interaction

**Step 14: CRITICAL VALIDATION**

- Place one piece on each square of white attack board
- Verify ALL pieces align perfectly with squares
- If any misalignment: FIX coordinate formulas now
- Do not proceed until 100% alignment

### Phase 5: Movement Validation

**Step 15: Create Direction Helpers**

Create `src/engine/rules/directionHelpers.ts`:
- Define movement directions for each piece type
- 3D direction vectors
- Path generation functions

**Step 16: Implement Move Validation**

Create `src/engine/rules/moveValidation.ts`:
- `getValidMoves(piece, world, pieces)` function
- Piece-specific movement rules
- Collision detection
- Bounds checking

**Step 17: Write Movement Tests**

Create tests for each piece type:
- Test basic movement
- Test captures
- Test blocking
- Test edge cases
- Test inter-level movement

### Phase 6: Game Logic

**Step 18: Create Game Engine**

Create `src/engine/gameEngine.ts`:
- `executeMove(state, from, to)` function
- Update piece positions
- Switch turns
- Check for check/checkmate
- Add to move history

**Step 19: Implement Check Detection**

Create `src/engine/rules/checkDetection.ts`:
- `isSquareAttacked(square, color, world, pieces)` function
- `isInCheck(color, world, pieces)` function
- `getAllValidMovesAvoidingCheck()` function

**Step 20: Add Move Indicators**

Create `src/components/Board3D/ValidMoveIndicators.tsx`:
- Show green circles on valid move squares
- Look up positions from world grid
- Update on piece selection

### Phase 7: Attack Board Movement

**Step 21: Implement Attack Board Movement**

Create `src/engine/world/worldMutation.ts`:
- `moveAttackBoard(world, boardId, newPinId, pieces)` function
- Validate movement rules
- Delete old squares from grid
- Create new squares at new pin
- Update piece coordinates
- Return new world and pieces

**Step 22: Test Attack Board Movement**

- Test board movement validation
- Test piece coordinate updates
- Test backward movement restriction
- Test inverted pin restriction

### Phase 8: UI Components

**Step 23: Create Game Controls**

Create `src/components/UI/GameControls.tsx`:
- New Game button
- Undo button
- Save/Load buttons
- Settings

**Step 24: Create Game Status**

Create `src/components/UI/GameStatus.tsx`:
- Current turn indicator
- Check/checkmate alerts
- Captured pieces display

**Step 25: Create Move History**

Create `src/components/UI/MoveHistory.tsx`:
- List all moves in notation
- Click to highlight move
- Scroll to latest

### Phase 9: Polish & Testing

**Step 26: Add Animations**

- Piece movement animation with react-spring or framer-motion
- Smooth camera transitions
- Board movement animation

**Step 27: Comprehensive Testing**

- Run all test suites
- Manual testing of all features
- Edge case testing
- Performance profiling

**Step 28: Documentation**

- Write README with game rules
- Add code comments
- Create architecture diagram
- Document API

---

## Part 6: Critical Implementation Details

### 6.1 World Grid Initialization

**CRITICAL: Determine coordinates through validation, not prescription**

```typescript
// Define your coordinate mapping functions ONCE
function fileToWorldX(file: number): number {
  // TODO: Determine formula that gives good spacing
  // Example: return file * SQUARE_SIZE + OFFSET_X;
  throw new Error('Implement based on visual requirements');
}

function rankToWorldY(rank: number): number {
  // TODO: Determine formula that matches rank continuity requirement
  // Example: return rank * SQUARE_SIZE + OFFSET_Y;
  throw new Error('Implement based on visual requirements');
}

export function createChessWorld(): ChessWorld {
  const world: ChessWorld = {
    squares: new Map(),
    boards: new Map(),
    pins: new Map(),
  };

  // Main boards - use rank ranges from Meder rules
  createMainBoard(world, 'WL', {
    files: [1, 2, 3, 4],    // a-d
    ranks: [2, 3, 4, 5],    // Meder rule: White main is ranks 2-5
    zHeight: 0,             // Start at ground level
  });

  createMainBoard(world, 'NL', {
    files: [1, 2, 3, 4],    // a-d
    ranks: [4, 5, 6, 7],    // Meder rule: Neutral overlaps 4-7
    zHeight: /* Calculate spacing */,
  });

  createMainBoard(world, 'BL', {
    files: [1, 2, 3, 4],    // a-d
    ranks: [6, 7, 8, 9],    // Meder rule: Black main is ranks 6-9
    zHeight: /* Calculate spacing */,
  });

  // Attack boards - DETERMINE initial pin positions from visual reference
  // White attack boards start "behind" white's main board
  // Black attack boards start "behind" black's main board
  createAttackBoard(world, 'WQL', determineInitialPin('WQL'));
  createAttackBoard(world, 'WKL', determineInitialPin('WKL'));
  createAttackBoard(world, 'BQL', determineInitialPin('BQL'));
  createAttackBoard(world, 'BKL', determineInitialPin('BKL'));

  // Load pins
  Object.entries(PIN_POSITIONS).forEach(([id, pin]) => {
    world.pins.set(id, pin);
  });

  return world;
}

function createMainBoard(
  world: ChessWorld, 
  boardId: string, 
  config: { files: number[]; ranks: number[]; zHeight: number }
) {
  const { files, ranks, zHeight } = config;

  for (const file of files) {
    for (const rank of ranks) {
      // Use consistent coordinate functions
      const worldX = fileToWorldX(file);
      const worldY = rankToWorldY(rank);
      const worldZ = zHeight;

      const square: WorldSquare = {
        id: `${fileToString(file)}${rank}${boardId}`,
        boardId,
        file,
        rank,
        level: boardId,
        worldX,
        worldY,
        worldZ,
        isValid: true,
        color: (file + rank) % 2 === 0 ? 'light' : 'dark',
      };

      world.squares.set(square.id, square);
    }
  }

  // Calculate board center from squares
  const centerX = (fileToWorldX(files[0]) + fileToWorldX(files[files.length - 1])) / 2;
  const centerY = (rankToWorldY(ranks[0]) + rankToWorldY(ranks[ranks.length - 1])) / 2;

  world.boards.set(boardId, {
    id: boardId,
    type: 'main',
    size: { width: files.length, height: ranks.length },
    centerX,
    centerY,
    centerZ: zHeight,
    rotation: 0,
    canMove: false,
  });
}
```

### 6.2 Board Rendering

```typescript
export function BoardRenderer() {
  const world = useGameStore((state) => state.world);

  return (
    <group>
      {Array.from(world.boards.values()).map(board => (
        <BoardPlatform key={board.id} board={board} />
      ))}
    </group>
  );
}

function BoardPlatform({ board }: { board: BoardLayout }) {
  const world = useGameStore((state) => state.world);
  
  const squares = Array.from(world.squares.values())
    .filter(sq => sq.boardId === board.id);

  return (
    <group>
      {/* Platform (can rotate for attack boards) */}
      <group
        position={[board.centerX, board.centerY, board.centerZ]}
        rotation={[0, 0, (board.rotation * Math.PI) / 180]}
      >
        <mesh position={[0, 0, -0.15]}>
          <boxGeometry args={[
            board.size.width * 2,
            board.size.height * 2,
            0.3
          ]} />
          <meshStandardMaterial
            color={board.type === 'main' ? '#8B4513' : '#A0522D'}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>

      {/* Squares (absolute positions, not rotated) */}
      {squares.map(square => (
        <mesh
          key={square.id}
          position={[square.worldX, square.worldY, square.worldZ]}
          onClick={() => handleSquareClick(square.id)}
        >
          <boxGeometry args={[1.9, 1.9, 0.1]} />
          <meshStandardMaterial
            color={square.color === 'light' ? '#F0D9B5' : '#B58863'}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
```

### 6.3 Piece Rendering

```typescript
export function Pieces3D() {
  const pieces = useGameStore((state) => state.pieces);
  const world = useGameStore((state) => state.world);

  return (
    <group>
      {pieces.map(piece => {
        const squareId = `${fileToString(piece.file)}${piece.rank}${piece.level}`;
        const square = world.squares.get(squareId);
        
        if (!square) {
          console.error(`Square not found: ${squareId}`);
          return null;
        }

        return (
          <ChessPiece
            key={piece.id}
            piece={piece}
            position={[square.worldX, square.worldY, square.worldZ + 0.5]}
          />
        );
      })}
    </group>
  );
}
```

### 6.4 Move Validation Example (Rook)

```typescript
export function getValidRookMoves(
  piece: Piece,
  world: ChessWorld,
  pieces: Piece[]
): string[] {
  const validSquares: string[] = [];
  const directions = [
    { file: 1, rank: 0, level: 0 },   // Right
    { file: -1, rank: 0, level: 0 },  // Left
    { file: 0, rank: 1, level: 0 },   // Forward
    { file: 0, rank: -1, level: 0 },  // Backward
    { file: 0, rank: 0, level: 1 },   // Up
    { file: 0, rank: 0, level: -1 },  // Down
  ];

  for (const dir of directions) {
    let distance = 1;
    while (true) {
      const targetFile = piece.file + dir.file * distance;
      const targetRank = piece.rank + dir.rank * distance;
      const targetLevel = getLevelByOffset(piece.level, dir.level * distance);
      
      if (!targetLevel) break;
      
      const squareId = `${fileToString(targetFile)}${targetRank}${targetLevel}`;
      const square = world.squares.get(squareId);
      
      if (!square || !square.isValid) break;
      
      const occupant = pieces.find(p => 
        p.file === targetFile && 
        p.rank === targetRank && 
        p.level === targetLevel
      );
      
      if (occupant) {
        if (occupant.color !== piece.color) {
          validSquares.push(squareId);  // Can capture
        }
        break;  // Blocked
      }
      
      validSquares.push(squareId);
      distance++;
    }
  }

  return validSquares;
}
```

### 6.5 Attack Board Movement

```typescript
export function moveAttackBoard(
  world: ChessWorld,
  boardId: string,
  newPinId: string,
  pieces: Piece[]
): { world: ChessWorld; pieces: Piece[] } {
  
  const board = world.boards.get(boardId)!;
  const currentPin = world.pins.get(board.currentPin!)!;
  const newPin = world.pins.get(newPinId)!;

  // Validation
  const piecesOnBoard = pieces.filter(p => p.level === boardId);
  
  if (piecesOnBoard.length > 1) {
    throw new Error('Cannot move board with >1 pieces');
  }
  
  if (!currentPin.adjacentPins.includes(newPinId)) {
    throw new Error('Not adjacent');
  }
  
  if (newPin.inverted && piecesOnBoard.length > 0) {
    throw new Error('Cannot move occupied board to inverted pin');
  }
  
  if (piecesOnBoard.length > 0 && newPin.level < currentPin.level) {
    throw new Error('Cannot move occupied board backward');
  }

  // Delete old squares
  const oldSquareIds = Array.from(world.squares.values())
    .filter(sq => sq.boardId === boardId)
    .map(sq => sq.id);
  oldSquareIds.forEach(id => world.squares.delete(id));

  // Create new squares
  const files = [newPin.fileOffset, newPin.fileOffset + 1];
  const ranks = [newPin.rankOffset, newPin.rankOffset + 1];
  
  for (const file of files) {
    for (const rank of ranks) {
      const square: WorldSquare = {
        id: `${fileToString(file)}${rank}${boardId}`,
        boardId,
        file,
        rank,
        level: boardId,
        worldX: (file + 0.5) * 2 - 6,
        worldY: (rank + 0.5) * 2,
        worldZ: newPin.zHeight,
        isValid: true,
        color: (file + rank) % 2 === 0 ? 'light' : 'dark',
      };
      world.squares.set(square.id, square);
    }
  }

  // Update board
  board.currentPin = newPinId;
  board.centerX = (files[0] + files[1] + 1) / 2 * 2 - 6;
  board.centerY = (ranks[0] + ranks[1] + 1) / 2 * 2;
  board.centerZ = newPin.zHeight;
  board.rotation = newPin.inverted ? 180 : 0;

  // Update pieces
  const updatedPieces = pieces.map(piece => {
    if (piece.level !== boardId) return piece;
    
    const oldFiles = [currentPin.fileOffset, currentPin.fileOffset + 1];
    const oldRanks = [currentPin.rankOffset, currentPin.rankOffset + 1];
    const localFileIdx = oldFiles.indexOf(piece.file);
    const localRankIdx = oldRanks.indexOf(piece.rank);
    
    return {
      ...piece,
      file: files[localFileIdx],
      rank: ranks[localRankIdx],
      movedAsPassenger: true,
    };
  });

  return { world, pieces: updatedPieces };
}
```

---

## Part 7: Validation & Debugging Strategy

### 7.0 Critical Validation Tests (Run These FIRST)

**BEFORE writing game logic, validate your coordinate system!**

These tests will catch the type of bugs that plagued the original implementation:

#### Test 1: Visual Alignment Test

```typescript
describe('Visual Alignment Validation', () => {
  it('should render pieces exactly on top of squares', () => {
    const world = createChessWorld();
    const testPiece: Piece = {
      id: 'test',
      type: 'pawn',
      color: 'white',
      file: 1,  // file 'a'
      rank: 2,  // rank 2
      level: 'WL',
      hasMoved: false,
    };

    // Get square position
    const squareId = `a2WL`;
    const square = world.squares.get(squareId);
    expect(square).toBeDefined();

    // Piece should render at same X,Y (slightly higher Z)
    const pieceX = square!.worldX;
    const pieceY = square!.worldY;
    const pieceZ = square!.worldZ + 0.5;

    // This is where the piece will render
    // Visually inspect: does it align?
    console.log(`Square a2WL at: (${square!.worldX}, ${square!.worldY}, ${square!.worldZ})`);
    console.log(`Piece should be at: (${pieceX}, ${pieceY}, ${pieceZ})`);
  });
});
```

**Manual Test**: Render a piece on every square of a board. Do they ALL align? If not, coordinate formula is wrong.

#### Test 2: Rank Continuity Test

```typescript
describe('Rank Continuity Validation', () => {
  it('should have same worldY for same rank across different boards', () => {
    const world = createChessWorld();
    
    // Rank 4 appears on both WL and NL
    const a4WL = world.squares.get('a4WL');
    const a4NL = world.squares.get('a4NL');
    
    expect(a4WL?.worldY).toEqual(a4NL?.worldY);
    
    // Rank 6 appears on both NL and BL
    const a6NL = world.squares.get('a6NL');
    const a6BL = world.squares.get('a6BL');
    
    expect(a6NL?.worldY).toEqual(a6BL?.worldY);
  });
  
  it('should have sequential worldY values for sequential ranks', () => {
    const world = createChessWorld();
    
    const rank0 = world.squares.get('a0WQL')?.worldY;
    const rank1 = world.squares.get('a1WQL')?.worldY;
    const rank2 = world.squares.get('a2WL')?.worldY;
    
    // Should be evenly spaced
    const spacing01 = rank1! - rank0!;
    const spacing12 = rank2! - rank1!;
    
    expect(spacing01).toBeCloseTo(spacing12, 2);
  });
});
```

#### Test 3: Attack Board Position Test

```typescript
describe('Attack Board Position Validation', () => {
  it('should position white attack boards BEFORE white main board', () => {
    const world = createChessWorld();
    
    // White attack board ranks (0-1) should have lower Y than white main (2-5)
    const maxAttackY = Math.max(
      world.squares.get('a1WQL')!.worldY,
      world.squares.get('e1WKL')!.worldY
    );
    
    const minMainY = Math.min(
      world.squares.get('a2WL')!.worldY,
      world.squares.get('d2WL')!.worldY
    );
    
    expect(maxAttackY).toBeLessThan(minMainY);
  });
  
  it('should position black attack boards AFTER black main board', () => {
    const world = createChessWorld();
    
    // Black main board ranks (6-9) max should be less than black attack min
    const maxMainY = Math.max(
      world.squares.get('a9BL')!.worldY,
      world.squares.get('d9BL')!.worldY
    );
    
    const minAttackY = Math.min(
      world.squares.get('z8BQL')!.worldY,
      world.squares.get('d8BKL')!.worldY
    );
    
    // Actually, attack boards OVERLAP with black main!
    // Ranks 8-9 are on BOTH BL and attack boards
    // So this test verifies the overlap:
    expect(minAttackY).toEqual(world.squares.get('a8BL')!.worldY);
  });
});
```

#### Test 4: Pin Position Validation

```typescript
describe('Pin Position Validation', () => {
  it('should have valid pin positions for attack boards', () => {
    const world = createChessWorld();
    
    // White attack boards start at pins QL1 and KL1
    const ql1 = world.pins.get('QL1');
    expect(ql1).toBeDefined();
    expect(ql1!.rankOffset).toBeDefined();
    
    // The pin's rankOffset should position the attack board at ranks 0-1
    // So rankOffset should be 0
    expect(ql1!.rankOffset).toEqual(0);
    
    // Black attack boards start at pins QL6 and KL6
    const ql6 = world.pins.get('QL6');
    expect(ql6!.rankOffset).toEqual(8);  // Ranks 8-9
  });
});
```

### 7.1 Debug Visualization Tools

**Create these tools to help validate positioning:**

```typescript
// Visual debug grid
export function WorldGridVisualizer() {
  const world = useGameStore(state => state.world);
  
  return (
    <group>
      {/* Show all squares as wireframes */}
      {Array.from(world.squares.values()).map(square => (
        <mesh
          key={square.id}
          position={[square.worldX, square.worldY, square.worldZ]}
        >
          <boxGeometry args={[1.9, 1.9, 0.05]} />
          <meshBasicMaterial color="cyan" wireframe />
        </mesh>
      ))}
      
      {/* Label each square */}
      {Array.from(world.squares.values()).map(square => (
        <Text
          key={`label-${square.id}`}
          position={[square.worldX, square.worldY, square.worldZ + 0.2]}
          fontSize={0.3}
          color="white"
        >
          {square.id}
        </Text>
      ))}
    </group>
  );
}
```

**Log coordinate mapping:**

```typescript
function debugCoordinateMapping() {
  console.log('=== Coordinate Mapping Debug ===');
  
  for (let rank = 0; rank <= 9; rank++) {
    const y = rankToWorldY(rank);
    console.log(`Rank ${rank} → worldY = ${y}`);
  }
  
  for (let file = 0; file <= 5; file++) {
    const x = fileToWorldX(file);
    const fileChar = ['z','a','b','c','d','e'][file];
    console.log(`File ${fileChar} (${file}) → worldX = ${x}`);
  }
}
```

---

## Part 8: Testing Requirements

### 7.1 Test Coverage Goals

- **World Grid**: 100% coverage
- **Move Validation**: 100% coverage
- **Game Logic**: >90% coverage
- **Components**: >70% coverage

### 7.2 Essential Test Cases

**World Grid Tests:**
- All squares have unique IDs
- All squares have valid world positions
- Board centers are correctly calculated
- Attack board squares update on movement

**Pawn Tests:**
- Forward movement (1 and 2 squares from start)
- Diagonal captures
- Cannot move backward
- Blocked by pieces
- Promotion on attack boards

**Rook Tests:**
- Horizontal movement
- Vertical movement
- Inter-level movement
- Blocked by pieces
- Capture enemy pieces

**Knight Tests:**
- L-shape movement in all orientations
- Jump over pieces
- 3D L-shapes (e.g., 2 files + 1 level)
- Edge case positions

**Bishop Tests:**
- Diagonal movement in XY plane
- Diagonal movement in XZ plane
- Diagonal movement in YZ plane
- Blocked by pieces

**Queen Tests:**
- Rook + Bishop combined movements

**King Tests:**
- One square in all directions
- Cannot move into check

**Check Detection Tests:**
- Detect check from all piece types
- Checkmate detection
- Stalemate detection
- Pin detection (piece can't move because king would be in check)

**Attack Board Tests:**
- Movement validation
- Piece coordinate updates
- Backward movement restriction
- Inverted pin restriction
- Passenger piece movement

### 7.3 Test Utilities

```typescript
// testUtils/boardSetup.ts
export function createTestWorld(): ChessWorld {
  return createChessWorld();
}

export function createEmptyGame(): GameState {
  return {
    world: createChessWorld(),
    pieces: [],
    currentTurn: 'white',
    moveHistory: [],
    highlightedSquareIds: [],
    stalemate: false,
  };
}

export function placePiece(
  game: GameState,
  type: PieceType,
  color: Color,
  file: number,
  rank: number,
  level: string
): GameState {
  const piece: Piece = {
    id: `${color}-${type}-${Date.now()}`,
    type,
    color,
    file,
    rank,
    level,
    hasMoved: false,
  };
  
  return {
    ...game,
    pieces: [...game.pieces, piece],
  };
}
```

---

## Part 8: Best Practices & Anti-Patterns

### 8.1 DO THESE THINGS ✅

1. **VALIDATE COORDINATES BEFORE PROCEEDING**
   - Run visual alignment tests FIRST
   - Use debug visualizer to see all squares
   - Test rank continuity across boards
   - Don't write game logic until coordinates are proven correct

2. **Use World Grid for All Positions**
   - Store positions once during initialization
   - Rendering reads from grid, never calculates
   - Attack board movement updates grid explicitly
   - ONE coordinate function for files, ONE for ranks

3. **Use Visual Reference, Not Guesswork**
   - Look at physical game diagrams
   - Measure distances visually
   - Verify with actual rendered output
   - Adjust formulas based on what you SEE

4. **Pre-compute Everything Possible**
   - Pin positions and adjacency
   - Board centers (calculated from squares, not hardcoded)
   - Square colors

5. **Separate Concerns**
   - Game logic in `engine/`
   - Rendering in `components/`
   - State management in `store/`
   - No game logic in components

6. **Write Validation Tests First**
   - Write coordinate validation before anything else
   - Write movement tests before implementation
   - Test edge cases
   - Use descriptive test names

7. **Use TypeScript Strictly**
   - No `any` types
   - Define interfaces for all data structures
   - Use strict mode

8. **Debug Visually**
   - Create debug visualizers
   - Log coordinates to console
   - Render wireframes to see alignment
   - Compare expected vs actual positions

### 8.2 DO NOT DO THESE THINGS ❌

1. **Don't Hardcode Coordinates Without Testing**
   - ❌ BAD: `rankOffset: 0` because "I think ranks start at 0"
   - ✅ GOOD: Test visually, verify pieces align with squares
   - **THE BUG**: Original implementation had attack board `rankOffset` values that didn't align with piece positions

2. **Don't Calculate Positions at Render Time**
   - ❌ BAD: `globalToWorld(piece.position)` in render
   - ✅ GOOD: `world.squares.get(squareId).worldX`

3. **Don't Have Multiple Sources of Truth**
   - ❌ BAD: Static BOARD_DEFINITIONS + dynamic boards array
   - ✅ GOOD: Single world grid that updates
   - **THE BUG**: Original had static definitions that didn't match dynamic game state

4. **Don't Use Different Formulas for Boards vs Pieces**
   - ❌ BAD: Boards use `centerY + offset`, pieces use `rank * 2`
   - ✅ GOOD: Both use same `rankToWorldY(rank)` function
   - **THE BUG**: Pieces and squares used different coordinate calculations

5. **Don't Rotate Square Positions**
   - ❌ BAD: Applying rotation to square coordinates
   - ✅ GOOD: Rotation only affects platform visual (cosmetic)

6. **Don't Mix Coordinate Systems**
   - ❌ BAD: Some components use one system, others use another
   - ✅ GOOD: Everyone uses world grid

7. **Don't Mutate State Directly**
   - ❌ BAD: `state.pieces[0].file = 2`
   - ✅ GOOD: `state.pieces = state.pieces.map(...)`

8. **Don't Skip Visual Validation**
   - ❌ BAD: "Tests pass, ship it" (without rendering)
   - ✅ GOOD: Actually SEE the pieces on squares before continuing
   - **THE BUG**: Original system had passing tests but visual misalignment

### 8.3 The Original Bug (Learn From This)

**What Went Wrong:**

The original implementation had attack boards rendering at wrong positions because:

1. **Attack board `rankOffset` was hardcoded** (e.g., QL1 had rankOffset: 0)
2. **Board squares were positioned** using `boardCenterY + relativePosition`
3. **Pieces were positioned** using `(rank + 0.5) * 2` (pure rank mapping)
4. **These two formulas didn't produce the same worldY values!**

Result: Pieces appeared "floating" off their squares by 1-2 ranks.

**How to Avoid:**

```typescript
// ❌ WRONG - Two different positioning systems
// Boards:
const boardCenterY = worldPosition.y + (size.height * SQUARE_SIZE) / 2;
const squareY = (y - size.height/2 + 0.5) * SQUARE_SIZE;

// Pieces:
const pieceY = (rank + 0.5) * 2;

// ✅ RIGHT - Same positioning function for everything
const squareY = rankToWorldY(rank);
const pieceY = rankToWorldY(rank);
```

**Validation that would have caught this:**

```typescript
// This test would FAIL in the original implementation
it('piece position should equal square position', () => {
  const square = world.squares.get('a8BQL');
  const piece = { file: 1, rank: 8, level: 'BQL' };
  
  const squareId = `a${piece.rank}${piece.level}`;
  const sq = world.squares.get(squareId);
  
  expect(sq.worldY).toEqual(square.worldY); // Would fail!
});
```

---

## Part 9: Performance Considerations

### 9.1 Optimization Strategies

**World Grid:**
- Use Map for O(1) lookups (not array.find)
- Pre-compute all positions (done once)
- Cache square queries if needed

**Rendering:**
- Use instanced meshes for squares (64+ squares)
- Memoize board components
- Throttle raycasting for hover detection
- Use LOD (Level of Detail) for pieces if performance issues

**State Updates:**
- Use Zustand selectors to minimize re-renders
- Update only changed pieces (immutable updates)
- Batch multiple state changes

**3D Models:**
- Load models once, reuse instances
- Use compressed textures
- Optimize polygon count (<5k per piece)

### 9.2 Memory Management

- Dispose of geometries and materials when unmounting
- Use texture atlases to reduce texture count
- Limit move history (e.g., last 100 moves)

---

## Part 10: Future Enhancements

### 10.1 Multiplayer Support

**Architecture Preparation:**
- Separate UI state from game state
- Use command pattern for all actions
- Make game state serializable
- Implement deterministic deserialization

**Implementation:**
- WebSocket connection to server
- Server validates all moves
- Clients replay validated commands
- Sync on reconnection

### 10.2 AI Opponent

**Algorithm:**
- Minimax with alpha-beta pruning
- Position evaluation function
- Move generation from valid moves
- Run in Web Worker (non-blocking)

**Difficulty Levels:**
- Easy: 2-ply search
- Medium: 4-ply search
- Hard: 6-ply search + opening book

### 10.3 Additional Features

- Save/load games (PGN-like format)
- Move annotations
- Game analysis
- Time controls
- Piece themes
- Board themes
- Sound effects
- Move suggestions (highlight best move)
- Tutorial mode

---

## Part 11: Deployment

### 11.1 Build Configuration

```json
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
        }
      }
    }
  }
});
```

### 11.2 Hosting

**Recommended Platforms:**
- Vercel (easiest)
- Netlify
- GitHub Pages
- Cloudflare Pages

**Build Commands:**
```bash
npm run build
npm run preview  # Test production build
```

### 11.3 Performance Optimization

- Enable gzip compression
- Use CDN for 3D models
- Lazy load models
- Code splitting

---

## Part 12: Summary Checklist

**Phase 1: Core Foundation**
- [ ] Project setup with Vite + React + TypeScript
- [ ] Install Three.js and react-three-fiber
- [ ] Create world grid types
- [ ] Implement world builder
- [ ] Write world grid tests (all passing)

**Phase 2: Game State**
- [ ] Create game types
- [ ] Implement initial piece setup
- [ ] Create Zustand store
- [ ] Test initial state

**Phase 3: Rendering**
- [ ] Set up Three.js scene
- [ ] Render boards from world grid
- [ ] Load 3D piece models
- [ ] Render pieces from world grid
- [ ] Add camera controls

**Phase 4: Movement**
- [ ] Implement direction helpers
- [ ] Create move validation for all pieces
- [ ] Write comprehensive movement tests (all passing)
- [ ] Add valid move indicators
- [ ] Implement piece selection and movement

**Phase 5: Game Logic**
- [ ] Create game engine (execute moves)
- [ ] Implement check detection
- [ ] Implement checkmate detection
- [ ] Add turn switching
- [ ] Track move history

**Phase 6: Attack Boards**
- [ ] Define all pin positions with adjacency
- [ ] Implement attack board movement function
- [ ] Update world grid on board movement
- [ ] Update piece positions (passengers)
- [ ] Write attack board tests (all passing)

**Phase 7: UI**
- [ ] Create game controls component
- [ ] Create game status display
- [ ] Create move history list
- [ ] Add highlighting for selected pieces
- [ ] Add check/checkmate alerts

**Phase 8: Polish**
- [ ] Add piece movement animations
- [ ] Add board movement animations
- [ ] Add hover effects
- [ ] Implement undo functionality
- [ ] Add sound effects (optional)

**Phase 9: Testing & Documentation**
- [ ] All tests passing (>90% coverage)
- [ ] Manual testing complete
- [ ] README with game rules
- [ ] Code comments complete
- [ ] Architecture documented

**Phase 10: Deployment**
- [ ] Production build successful
- [ ] Deploy to hosting platform
- [ ] Performance optimization
- [ ] Cross-browser testing

---

## Part 13: Quick Reference

### Coordinate System Requirements

**Do NOT copy these formulas blindly - they are EXAMPLES that may contain bugs!**

Derive your own formulas that satisfy these requirements:

1. **Rank Continuity**: `rankToWorldY(N)` must return same value regardless of which board it's on
2. **Even Spacing**: Difference between consecutive ranks should be constant
3. **File Consistency**: `fileToWorldX(N)` must return same value for all boards
4. **Alignment**: Pieces and squares use SAME functions

```typescript
// File string conversion (this part is safe to use)
fileToString(file: number): string {
  return ['z', 'a', 'b', 'c', 'd', 'e'][file];
}

// Square ID format (safe to use)
squareId = `${fileChar}${rank}${boardId}`
// Examples: "a2WL", "z0WQL", "e9BKL"
```

### Board Z-Heights Approach

**Don't hardcode - calculate from spacing:**

```typescript
const BOARD_SPACING = /* Your choice, e.g., 5.0 */;
const ATTACK_OFFSET = /* Your choice, e.g., 2.0 above main board */;

const Z_WHITE_MAIN = 0;
const Z_NEUTRAL_MAIN = Z_WHITE_MAIN + BOARD_SPACING;
const Z_BLACK_MAIN = Z_WHITE_MAIN + (2 * BOARD_SPACING);

// Attack boards float above or below their associated main board
// Determine based on visual preference
```

### Color Values

```typescript
const COLORS = {
  lightSquare: '#F0D9B5',
  darkSquare: '#B58863',
  mainPlatform: '#8B4513',
  attackPlatform: '#A0522D',
  whitePiece: '#f5f5f5',
  blackPiece: '#2c2c2c',
  highlight: '#FFD700',
  validMove: '#90EE90',
  check: '#FF6347',
};
```

### Common Zustand Selectors

```typescript
// Get world
const world = useGameStore(state => state.world);

// Get pieces
const pieces = useGameStore(state => state.pieces);

// Get current turn
const turn = useGameStore(state => state.currentTurn);

// Get selected square
const selectedId = useGameStore(state => state.selectedSquareId);

// Actions
const { selectSquare, movePiece, resetGame } = useGameStore();
```

---

## Conclusion

This design document provides a complete blueprint for building a 3D chess game with proper architecture. The **world grid system** is the key innovation that eliminates coordinate bugs by storing positions directly rather than calculating them repeatedly.

**Key Takeaways:**
1. Build world grid first, test it thoroughly
2. Rendering simply reads from grid (no calculations)
3. Attack boards update grid explicitly
4. Test everything (especially movement)
5. Keep game logic separate from rendering
6. Use TypeScript strictly

Follow the implementation phases in order, test at each step, and you'll have a fully functional 3D chess game with clean architecture and excellent performance.

Good luck! 🚀

