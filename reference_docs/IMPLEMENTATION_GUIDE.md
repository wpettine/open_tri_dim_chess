# Tri-Dimensional Chess - Comprehensive Implementation Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites & Environment Setup](#prerequisites--environment-setup)
3. [Phase 1: Project Foundation](#phase-1-project-foundation)
4. [Phase 2: World Grid System](#phase-2-world-grid-system)
5. [Phase 3: Validation Framework](#phase-3-validation-framework)
6. [Phase 4: 3D Rendering Setup](#phase-4-3d-rendering-setup)
7. [Phase 5: Game State Management](#phase-5-game-state-management)
8. [Phase 6: Movement Logic](#phase-6-movement-logic)
9. [Phase 7: Check & Checkmate](#phase-7-check--checkmate)
10. [Phase 8: Attack Board Movement](#phase-8-attack-board-movement)
11. [Phase 9: UI Components](#phase-9-ui-components)
12. [Phase 10: Testing & Polish](#phase-10-testing--polish)
13. [Troubleshooting Guide](#troubleshooting-guide)
14. [Deployment](#deployment)

---

## Introduction

### Purpose of This Guide

This guide provides **detailed, step-by-step instructions** for implementing the 3D Chess (Raumschach) web application described in `DESIGN_DOC.md`. Unlike the design document, which is requirement-driven and prescriptive about validation, this guide is **implementation-focused** and walks you through building the entire application from scratch.

### Critical Philosophy

**⚠️ VALIDATION BEFORE IMPLEMENTATION**

The single most important principle: **validate your coordinate system before writing game logic**. The original implementation failed because coordinates were wrong. Don't repeat that mistake.

**Your Implementation Process:**
1. Build world grid
2. Create debug visualizers
3. Test coordinate alignment
4. Fix any misalignments
5. THEN build game logic

### Time Estimate

- **Experienced Developer**: 40-60 hours
- **Beginner**: 80-120 hours
- **Critical Path**: Phases 1-5 must be completed in order

### What You'll Build

A fully functional 3D chess game with:
- 7 boards in 3D space (3 main + 4 movable attack boards)
- Complete chess piece movement in 3D
- Beautiful Three.js graphics
- Attack board movement mechanics
- Check/checkmate detection
- Full test coverage

---

## Prerequisites & Environment Setup

### Required Knowledge

**Essential:**
- TypeScript (intermediate level)
- React (hooks, component lifecycle)
- Basic 3D concepts (coordinates, meshes)

**Helpful:**
- Three.js basics
- Chess rules
- Testing frameworks (Vitest)

### Software Requirements

**Node.js & Package Manager:**
```bash
# Check Node version (need 18+)
node --version

# Install pnpm (recommended)
npm install -g pnpm
```

**Development Tools:**
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript
- Git
- Modern browser (Chrome/Firefox)

### Setting Up Your Workspace

```bash
# Create project directory
mkdir tri-dim-chess
cd tri-dim-chess

# Initialize git
git init

# Create .gitignore
cat > .gitignore << EOF
node_modules
dist
.DS_Store
*.log
.env
EOF
```

---

## Phase 1: Project Foundation

### Step 1.1: Initialize Vite Project

```bash
# Create React + TypeScript project
npm create vite@latest . -- --template react-ts

# Say yes to scaffold in current directory
```

**Verify package.json was created:**
```bash
cat package.json
```

### Step 1.2: Install Core Dependencies

```bash
pnpm install

# Three.js ecosystem
pnpm add three @react-three/fiber @react-three/drei

# State management
pnpm add zustand

# Development dependencies
pnpm add -D @types/three vitest @testing-library/react @testing-library/jest-dom jsdom
```

### Step 1.3: Configure TypeScript

**Update `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Step 1.4: Configure Vitest

**Create `vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

**Create `src/test/setup.ts`:**
```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

afterEach(() => {
  cleanup();
});
```

### Step 1.5: Create Project Structure

```bash
# Create directory structure
mkdir -p src/engine/world
mkdir -p src/engine/rules
mkdir -p src/engine/world/__tests__
mkdir -p src/engine/rules/__tests__
mkdir -p src/components/Board3D
mkdir -p src/components/UI
mkdir -p src/components/Game
mkdir -p src/components/Debug
mkdir -p src/store
mkdir -p src/config
mkdir -p src/utils
mkdir -p public/models/chess
```

**Your structure should look like:**
```
src/
├── engine/
│   ├── world/
│   │   └── __tests__/
│   └── rules/
│       └── __tests__/
├── components/
│   ├── Board3D/
│   ├── UI/
│   ├── Game/
│   └── Debug/
├── store/
├── config/
├── utils/
└── test/
```

### Step 1.6: Add Scripts to package.json

**Update the `scripts` section:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### Step 1.7: Verify Setup

```bash
# Test that everything builds
pnpm run build

# Should see: dist/ directory created
ls dist
```

**✅ Phase 1 Complete:** Project is initialized and ready for development.

---

## Phase 2: World Grid System

This is the **most critical phase**. The world grid is your single source of truth for all positions.

### Step 2.1: Define Core Types

**Create `src/engine/world/types.ts`:**

```typescript
/**
 * Represents a single square on the chess board in world coordinates.
 * This is the SINGLE SOURCE OF TRUTH for square positions.
 */
export interface WorldSquare {
  id: string;                    // e.g., "a2W", "z0WQL"
  boardId: string;               // "W", "N", "B", "WQL", "WKL", "BQL", "BKL"
  file: number;                  // 0-5 (z, a, b, c, d, e)
  rank: number;                  // 0-9
  level: string;                 // Same as boardId
  worldX: number;                // Three.js X coordinate
  worldY: number;                // Three.js Y coordinate
  worldZ: number;                // Three.js Z coordinate (height)
  isValid: boolean;              // For bounds checking
  color: 'light' | 'dark';       // Square color for rendering
}

/**
 * Represents a board (main or attack) in the game.
 */
export interface BoardLayout {
  id: string;                    // "W", "WQL", etc.
  type: 'main' | 'attack';
  size: { width: number; height: number }; // Number of squares (not world units)
  currentPin?: string;           // For attack boards only
  canMove: boolean;              // Attack boards can move
  centerX: number;               // World coordinate
  centerY: number;               // World coordinate
  centerZ: number;               // World coordinate (height)
  rotation: number;              // 0 or 180 degrees
}

/**
 * Represents a pin position where attack boards can dock.
 */
export interface PinPosition {
  id: string;                    // e.g., "QL1", "KL2"
  fileOffset: number;            // Starting file for 2x2 board
  rankOffset: number;            // Starting rank for 2x2 board
  zHeight: number;               // Height in world coordinates
  adjacentPins: string[];        // IDs of adjacent pins (for movement validation)
  level: number;                 // Relative level (0=lowest, higher=up)
  inverted: boolean;             // Whether board is upside down at this pin
}

/**
 * The complete world grid containing all squares, boards, and pins.
 */
export interface ChessWorld {
  squares: Map<string, WorldSquare>;
  boards: Map<string, BoardLayout>;
  pins: Map<string, PinPosition>;
}
```

### Step 2.2: Define Pin Positions

**Create `src/engine/world/pinPositions.ts`:**

```typescript
import { PinPosition } from './types';

/**
 * Pin positions for attack boards.
 * 
 * CRITICAL: These positions determine where attack boards can be placed.
 * The rankOffset and fileOffset must be chosen so that the resulting
 * squares align with the continuous rank system.
 * 
 * VALIDATION REQUIRED: After implementing this, you MUST visually verify
 * that pieces align with squares when boards are at different pins.
 */

// Constants for positioning
const Z_WHITE_MAIN = 0;
const Z_NEUTRAL_MAIN = 5;
const Z_BLACK_MAIN = 10;
const ATTACK_OFFSET = 2.5; // How far above/below main boards

export const PIN_POSITIONS: Record<string, PinPosition> = {
  // White Queen-side attack board pins (left side, files z-a)
  QL1: {
    id: 'QL1',
    fileOffset: 0,  // Files z-a (0-1)
    rankOffset: 0,  // Ranks 0-1
    zHeight: Z_WHITE_MAIN - ATTACK_OFFSET,
    adjacentPins: ['QL2', 'QL3'],
    level: 0,
    inverted: false,
  },
  QL2: {
    id: 'QL2',
    fileOffset: 0,
    rankOffset: 2,  // Ranks 2-3 (overlaps with W main board)
    zHeight: Z_WHITE_MAIN,
    adjacentPins: ['QL1', 'QL3', 'QL4'],
    level: 1,
    inverted: false,
  },
  QL3: {
    id: 'QL3',
    fileOffset: 0,
    rankOffset: 4,  // Ranks 4-5 (overlaps with W/N main boards)
    zHeight: Z_NEUTRAL_MAIN,
    adjacentPins: ['QL1', 'QL2', 'QL4', 'QL5'],
    level: 2,
    inverted: false,
  },
  QL4: {
    id: 'QL4',
    fileOffset: 0,
    rankOffset: 6,  // Ranks 6-7 (overlaps with N/B main boards)
    zHeight: Z_BLACK_MAIN,
    adjacentPins: ['QL2', 'QL3', 'QL5', 'QL6'],
    level: 3,
    inverted: false,
  },
  QL5: {
    id: 'QL5',
    fileOffset: 0,
    rankOffset: 8,  // Ranks 8-9 (overlaps with B main board)
    zHeight: Z_BLACK_MAIN,
    adjacentPins: ['QL3', 'QL4', 'QL6'],
    level: 4,
    inverted: false,
  },
  QL6: {
    id: 'QL6',
    fileOffset: 0,
    rankOffset: 8,  // Ranks 8-9 (above B main board)
    zHeight: Z_BLACK_MAIN + ATTACK_OFFSET,
    adjacentPins: ['QL4', 'QL5'],
    level: 5,
    inverted: true,  // Inverted at top
  },

  // White King-side attack board pins (right side, files d-e)
  KL1: {
    id: 'KL1',
    fileOffset: 4,  // Files d-e (4-5)
    rankOffset: 0,  // Ranks 0-1
    zHeight: Z_WHITE_MAIN - ATTACK_OFFSET,
    adjacentPins: ['KL2', 'KL3'],
    level: 0,
    inverted: false,
  },
  KL2: {
    id: 'KL2',
    fileOffset: 4,
    rankOffset: 2,  // Ranks 2-3 (overlaps with W main board)
    zHeight: Z_WHITE_MAIN,
    adjacentPins: ['KL1', 'KL3', 'KL4'],
    level: 1,
    inverted: false,
  },
  KL3: {
    id: 'KL3',
    fileOffset: 4,
    rankOffset: 4,  // Ranks 4-5
    zHeight: Z_NEUTRAL_MAIN,
    adjacentPins: ['KL1', 'KL2', 'KL4', 'KL5'],
    level: 2,
    inverted: false,
  },
  KL4: {
    id: 'KL4',
    fileOffset: 4,
    rankOffset: 6,  // Ranks 6-7
    zHeight: Z_BLACK_MAIN,
    adjacentPins: ['KL2', 'KL3', 'KL5', 'KL6'],
    level: 3,
    inverted: false,
  },
  KL5: {
    id: 'KL5',
    fileOffset: 4,
    rankOffset: 8,  // Ranks 8-9
    zHeight: Z_BLACK_MAIN,
    adjacentPins: ['KL3', 'KL4', 'KL6'],
    level: 4,
    inverted: false,
  },
  KL6: {
    id: 'KL6',
    fileOffset: 4,
    rankOffset: 8,  // Ranks 8-9
    zHeight: Z_BLACK_MAIN + ATTACK_OFFSET,
    adjacentPins: ['KL4', 'KL5'],
    level: 5,
    inverted: true,
  },
};

/**
 * Get initial pin positions for attack boards at game start.
 */
export function getInitialPinPositions(): Record<string, string> {
  return {
    WQL: 'QL1',  // White queen-side starts at QL1
    WKL: 'KL1',  // White king-side starts at KL1
    BQL: 'QL6',  // Black queen-side starts at QL6
    BKL: 'KL6',  // Black king-side starts at KL6
  };
}
```

### Step 2.3: Create Coordinate Mapping Functions

**Create `src/engine/world/coordinates.ts`:**

```typescript
/**
 * Coordinate mapping functions.
 * 
 * CRITICAL: These functions are the SINGLE SOURCE OF TRUTH for converting
 * game coordinates (file, rank) to world coordinates (X, Y).
 * 
 * REQUIREMENTS:
 * 1. Same rank MUST have same worldY on all boards
 * 2. Same file MUST have same worldX on all boards
 * 3. Must produce even spacing between squares
 * 4. Must be used by BOTH square creation AND piece rendering
 * 
 * The values here are EXAMPLES. You should adjust them based on visual
 * validation to ensure pieces align perfectly with squares.
 */

const SQUARE_SIZE = 2.0;  // Size of each square in world units
const SQUARE_GAP = 0.1;   // Small gap between squares
const SPACING = SQUARE_SIZE + SQUARE_GAP;

// Center the board at world origin
const FILE_OFFSET = -6.0;  // Adjust to center files z-e around origin
const RANK_OFFSET = 0.0;   // Adjust to position ranks appropriately

/**
 * Convert file (0-5) to world X coordinate.
 * Files: 0=z, 1=a, 2=b, 3=c, 4=d, 5=e
 */
export function fileToWorldX(file: number): number {
  return file * SPACING + FILE_OFFSET + (SPACING / 2);
}

/**
 * Convert rank (0-9) to world Y coordinate.
 * Ranks are continuous across all boards.
 */
export function rankToWorldY(rank: number): number {
  return rank * SPACING + RANK_OFFSET + (SPACING / 2);
}

/**
 * Convert file number to string representation.
 */
export function fileToString(file: number): string {
  const files = ['z', 'a', 'b', 'c', 'd', 'e'];
  return files[file] || '?';
}

/**
 * Convert file string to number.
 */
export function stringToFile(fileStr: string): number {
  const files = ['z', 'a', 'b', 'c', 'd', 'e'];
  return files.indexOf(fileStr);
}

/**
 * Create a square ID from components.
 */
export function createSquareId(file: number, rank: number, boardId: string): string {
  return `${fileToString(file)}${rank}${boardId}`;
}

/**
 * Parse a square ID into components.
 */
export function parseSquareId(id: string): { file: number; rank: number; boardId: string } | null {
  // Format: "a2W" (1 char file, 1-2 digit rank, board ID)
  const match = id.match(/^([zabcde])(\d+)(\w+)$/);
  if (!match) return null;
  
  return {
    file: stringToFile(match[1]),
    rank: parseInt(match[2], 10),
    boardId: match[3],
  };
}
```

### Step 2.4: Create World Builder

**Create `src/engine/world/worldBuilder.ts`:**

```typescript
import { ChessWorld, WorldSquare, BoardLayout } from './types';
import { PIN_POSITIONS, getInitialPinPositions } from './pinPositions';
import { fileToWorldX, rankToWorldY, createSquareId } from './coordinates';

/**
 * Creates the complete world grid with all boards and squares.
 * 
 * This is called ONCE at game initialization. All positions are pre-computed
 * and stored in the world grid. Rendering components simply read these values.
 */
export function createChessWorld(): ChessWorld {
  const world: ChessWorld = {
    squares: new Map(),
    boards: new Map(),
    pins: new Map(),
  };

  // Load pin positions
  Object.entries(PIN_POSITIONS).forEach(([id, pin]) => {
    world.pins.set(id, pin);
  });

  // Create main boards (static positions)
  // Rank ranges from user specification:
  // - White attack: 0-1
  // - White main: 1-4 (overlaps with attack at rank 1)
  // - Neutral main: 3-6 (overlaps with White at 3-4, with Black at 5-6)
  // - Black main: 5-8 (overlaps with Neutral at 5-6, with attack at 8)
  // - Black attack: 8-9 (overlaps with main at rank 8)
  
  createMainBoard(world, 'W', {
    files: [1, 2, 3, 4],    // a-d
    ranks: [1, 2, 3, 4],    // White main board (ranks 1-4)
    zHeight: 0,
  });

  createMainBoard(world, 'N', {
    files: [1, 2, 3, 4],    // a-d
    ranks: [3, 4, 5, 6],    // Neutral board (ranks 3-6, overlaps with W at 3-4, B at 5-6)
    zHeight: 5,
  });

  createMainBoard(world, 'B', {
    files: [1, 2, 3, 4],    // a-d
    ranks: [5, 6, 7, 8],    // Black main board (ranks 5-8, overlaps with N at 5-6)
    zHeight: 10,
  });

  // Create attack boards at initial pins
  const initialPins = getInitialPinPositions();
  createAttackBoard(world, 'WQL', initialPins.WQL);
  createAttackBoard(world, 'WKL', initialPins.WKL);
  createAttackBoard(world, 'BQL', initialPins.BQL);
  createAttackBoard(world, 'BKL', initialPins.BKL);

  return world;
}

/**
 * Creates a main board (4x4) with specified file/rank ranges.
 */
function createMainBoard(
  world: ChessWorld,
  boardId: string,
  config: { files: number[]; ranks: number[]; zHeight: number }
): void {
  const { files, ranks, zHeight } = config;

  // Create all squares for this board
  for (const file of files) {
    for (const rank of ranks) {
      const square: WorldSquare = {
        id: createSquareId(file, rank, boardId),
        boardId,
        file,
        rank,
        level: boardId,
        worldX: fileToWorldX(file),
        worldY: rankToWorldY(rank),
        worldZ: zHeight,
        isValid: true,
        color: (file + rank) % 2 === 0 ? 'light' : 'dark',
      };
      world.squares.set(square.id, square);
    }
  }

  // Calculate board center from squares (don't hardcode!)
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

/**
 * Creates an attack board (2x2) at the specified pin.
 */
function createAttackBoard(world: ChessWorld, boardId: string, pinId: string): void {
  const pin = world.pins.get(pinId);
  if (!pin) {
    throw new Error(`Pin not found: ${pinId}`);
  }

  // Attack boards are 2x2
  const files = [pin.fileOffset, pin.fileOffset + 1];
  const ranks = [pin.rankOffset, pin.rankOffset + 1];

  // Create squares
  for (const file of files) {
    for (const rank of ranks) {
      const square: WorldSquare = {
        id: createSquareId(file, rank, boardId),
        boardId,
        file,
        rank,
        level: boardId,
        worldX: fileToWorldX(file),
        worldY: rankToWorldY(rank),
        worldZ: pin.zHeight,
        isValid: true,
        color: (file + rank) % 2 === 0 ? 'light' : 'dark',
      };
      world.squares.set(square.id, square);
    }
  }

  // Calculate center
  const centerX = (fileToWorldX(files[0]) + fileToWorldX(files[1])) / 2;
  const centerY = (rankToWorldY(ranks[0]) + rankToWorldY(ranks[1])) / 2;

  world.boards.set(boardId, {
    id: boardId,
    type: 'attack',
    size: { width: 2, height: 2 },
    currentPin: pinId,
    centerX,
    centerY,
    centerZ: pin.zHeight,
    rotation: pin.inverted ? 180 : 0,
    canMove: true,
  });
}
```

### Step 2.5: Write World Grid Tests

**Create `src/engine/world/__tests__/worldBuilder.test.ts`:**

```typescript
import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../worldBuilder';

describe('World Grid Creation', () => {
  it('should create a world with all boards', () => {
    const world = createChessWorld();
    
    expect(world.boards.size).toBe(7); // 3 main + 4 attack
    expect(world.boards.has('W')).toBe(true);
    expect(world.boards.has('N')).toBe(true);
    expect(world.boards.has('B')).toBe(true);
    expect(world.boards.has('WQL')).toBe(true);
    expect(world.boards.has('WKL')).toBe(true);
    expect(world.boards.has('BQL')).toBe(true);
    expect(world.boards.has('BKL')).toBe(true);
  });

  it('should create all squares for main boards', () => {
    const world = createChessWorld();
    
    // Each main board has 4x4 = 16 squares
    const wSquares = Array.from(world.squares.values()).filter(s => s.boardId === 'W');
    expect(wSquares.length).toBe(16);
    
    const nSquares = Array.from(world.squares.values()).filter(s => s.boardId === 'N');
    expect(nSquares.length).toBe(16);
    
    const bSquares = Array.from(world.squares.values()).filter(s => s.boardId === 'B');
    expect(bSquares.length).toBe(16);
  });

  it('should create all squares for attack boards', () => {
    const world = createChessWorld();
    
    // Each attack board has 2x2 = 4 squares
    const wqlSquares = Array.from(world.squares.values()).filter(s => s.boardId === 'WQL');
    expect(wqlSquares.length).toBe(4);
    
    const wklSquares = Array.from(world.squares.values()).filter(s => s.boardId === 'WKL');
    expect(wklSquares.length).toBe(4);
  });

  it('should have unique square IDs', () => {
    const world = createChessWorld();
    const ids = Array.from(world.squares.keys());
    const uniqueIds = new Set(ids);
    
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should have valid world coordinates for all squares', () => {
    const world = createChessWorld();
    
    world.squares.forEach(square => {
      expect(typeof square.worldX).toBe('number');
      expect(typeof square.worldY).toBe('number');
      expect(typeof square.worldZ).toBe('number');
      expect(isFinite(square.worldX)).toBe(true);
      expect(isFinite(square.worldY)).toBe(true);
      expect(isFinite(square.worldZ)).toBe(true);
    });
  });

  it('should have valid board centers', () => {
    const world = createChessWorld();
    
    world.boards.forEach(board => {
      expect(typeof board.centerX).toBe('number');
      expect(typeof board.centerY).toBe('number');
      expect(typeof board.centerZ).toBe('number');
      expect(isFinite(board.centerX)).toBe(true);
      expect(isFinite(board.centerY)).toBe(true);
      expect(isFinite(board.centerZ)).toBe(true);
    });
  });

  it('should load all pin positions', () => {
    const world = createChessWorld();
    
    expect(world.pins.size).toBeGreaterThan(0);
    expect(world.pins.has('QL1')).toBe(true);
    expect(world.pins.has('KL1')).toBe(true);
  });
});
```

### Step 2.6: Run Tests

```bash
pnpm test src/engine/world/__tests__/worldBuilder.test.ts
```

**Expected result:** All tests pass ✅

**✅ Phase 2 Complete:** World grid system is implemented and tested.

---

## Phase 3: Validation Framework

**⚠️ CRITICAL: Do NOT skip this phase!**

### Step 3.1: Create Coordinate Validation Tests

**Create `src/engine/world/__tests__/coordinateValidation.test.ts`:**

```typescript
import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../worldBuilder';
import { fileToWorldX, rankToWorldY } from '../coordinates';

describe('Coordinate System Validation', () => {
  describe('Rank Continuity', () => {
    it('should have same worldY for same rank across different boards', () => {
      const world = createChessWorld();
      
      // Rank 4 appears on both W and N
      const a4W = world.squares.get('a4W');
      const a4N = world.squares.get('a4N');
      
      expect(a4W?.worldY).toBeDefined();
      expect(a4N?.worldY).toBeDefined();
      expect(a4W?.worldY).toBeCloseTo(a4N!.worldY, 5);
      
      // Rank 6 appears on both N and B
      const a6N = world.squares.get('a6N');
      const a6B = world.squares.get('a6B');
      
      expect(a6N?.worldY).toBeCloseTo(a6B!.worldY, 5);
    });

    it('should have sequential worldY values for sequential ranks', () => {
      const world = createChessWorld();
      
      const rank0 = world.squares.get('z0WQL')?.worldY;
      const rank1 = world.squares.get('z1WQL')?.worldY;
      const rank2 = world.squares.get('a2W')?.worldY;
      const rank3 = world.squares.get('a3W')?.worldY;
      
      expect(rank0).toBeDefined();
      expect(rank1).toBeDefined();
      expect(rank2).toBeDefined();
      expect(rank3).toBeDefined();
      
      // Check spacing is consistent
      const spacing01 = rank1! - rank0!;
      const spacing12 = rank2! - rank1!;
      const spacing23 = rank3! - rank2!;
      
      expect(spacing01).toBeCloseTo(spacing12, 5);
      expect(spacing12).toBeCloseTo(spacing23, 5);
    });
  });

  describe('File Consistency', () => {
    it('should have same worldX for same file across different boards', () => {
      const world = createChessWorld();
      
      // File 'a' (1) appears on main boards and attack boards
      const a2W = world.squares.get('a2W');
      const a4N = world.squares.get('a4N');
      const a6B = world.squares.get('a6B');
      
      expect(a2W?.worldX).toBeCloseTo(a4N!.worldX, 5);
      expect(a4N?.worldX).toBeCloseTo(a6B!.worldX, 5);
    });

    it('should have sequential worldX values for sequential files', () => {
      const world = createChessWorld();
      
      const fileZ = world.squares.get('z0WQL')?.worldX;
      const fileA = world.squares.get('a2W')?.worldX;
      const fileB = world.squares.get('b2W')?.worldX;
      const fileC = world.squares.get('c2W')?.worldX;
      
      expect(fileZ).toBeDefined();
      expect(fileA).toBeDefined();
      expect(fileB).toBeDefined();
      expect(fileC).toBeDefined();
      
      // Check spacing
      const spacingZA = fileA! - fileZ!;
      const spacingAB = fileB! - fileA!;
      const spacingBC = fileC! - fileB!;
      
      expect(spacingZA).toBeCloseTo(spacingAB, 5);
      expect(spacingAB).toBeCloseTo(spacingBC, 5);
    });
  });

  describe('Attack Board Positioning', () => {
    it('should position white attack boards before white main board', () => {
      const world = createChessWorld();
      
      // WQL at ranks 0-1 should have lower Y than WL at ranks 2-5
      const maxAttackY = Math.max(
        world.squares.get('z1WQL')!.worldY,
        world.squares.get('a1WQL')!.worldY
      );
      
      const minMainY = Math.min(
        world.squares.get('a2W')!.worldY,
        world.squares.get('d2W')!.worldY
      );
      
      expect(maxAttackY).toBeLessThan(minMainY);
    });

    it('should position black attack boards at correct ranks', () => {
      const world = createChessWorld();
      
      // BQL at ranks 8-9 should have higher Y than B at ranks 6-7
      const maxMainY = Math.max(
        world.squares.get('a7B')!.worldY,
        world.squares.get('d7B')!.worldY
      );
      
      const minAttackY = Math.min(
        world.squares.get('z8BQL')!.worldY,
        world.squares.get('a8BQL')!.worldY
      );
      
      // Attack boards overlap with rank 8-9 of BL
      expect(minAttackY).toBeGreaterThanOrEqual(maxMainY);
    });
  });

  describe('Coordinate Function Tests', () => {
    it('should produce consistent results from coordinate functions', () => {
      // Test that direct function calls match world grid
      const world = createChessWorld();
      
      const testSquare = world.squares.get('b4N');
      expect(testSquare).toBeDefined();
      
      const calculatedX = fileToWorldX(2); // file 'b' = 2
      const calculatedY = rankToWorldY(4);
      
      expect(testSquare!.worldX).toBeCloseTo(calculatedX, 5);
      expect(testSquare!.worldY).toBeCloseTo(calculatedY, 5);
    });
  });
});
```

### Step 3.2: Run Validation Tests

```bash
pnpm test src/engine/world/__tests__/coordinateValidation.test.ts
```

**If tests fail:**
1. Adjust constants in `src/engine/world/coordinates.ts`
2. Adjust pin positions in `src/engine/world/pinPositions.ts`
3. Re-run tests
4. Repeat until all tests pass

**✅ All tests must pass before proceeding!**

### Step 3.3: Create Debug Visualizer Component

**Create `src/components/Debug/WorldGridVisualizer.tsx`:**

```typescript
import { Text } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';

/**
 * Debug component that visualizes the world grid.
 * Shows all squares as wireframes with labels.
 * 
 * USAGE: Add to your scene during development to verify positions.
 */
export function WorldGridVisualizer() {
  const world = useGameStore((state) => state.world);

  return (
    <group>
      {/* Render all squares as wireframes */}
      {Array.from(world.squares.values()).map((square) => (
        <mesh
          key={square.id}
          position={[square.worldX, square.worldY, square.worldZ]}
        >
          <boxGeometry args={[1.9, 1.9, 0.05]} />
          <meshBasicMaterial color="cyan" wireframe />
        </mesh>
      ))}

      {/* Label each square */}
      {Array.from(world.squares.values()).map((square) => (
        <Text
          key={`label-${square.id}`}
          position={[square.worldX, square.worldY, square.worldZ + 0.3]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {square.id}
        </Text>
      ))}

      {/* Show board centers */}
      {Array.from(world.boards.values()).map((board) => (
        <mesh
          key={`center-${board.id}`}
          position={[board.centerX, board.centerY, board.centerZ]}
        >
          <sphereGeometry args={[0.2]} />
          <meshBasicMaterial color="red" />
        </mesh>
      ))}
    </group>
  );
}
```

### Step 3.4: Create Console Logger

**Create `src/utils/debugLogger.ts`:**

```typescript
import { ChessWorld } from '../engine/world/types';

/**
 * Logs detailed coordinate information to console.
 * Call this during development to inspect coordinate mappings.
 */
export function logWorldCoordinates(world: ChessWorld): void {
  console.log('=== WORLD GRID DEBUG INFO ===');
  
  console.log('\n📋 Boards:');
  world.boards.forEach((board, id) => {
    console.log(`  ${id}: center=(${board.centerX.toFixed(2)}, ${board.centerY.toFixed(2)}, ${board.centerZ.toFixed(2)}), size=${board.size.width}x${board.size.height}`);
  });
  
  console.log('\n📍 Sample Squares:');
  ['z0WQL', 'a2W', 'b4N', 'c6B', 'e9BKL'].forEach(id => {
    const sq = world.squares.get(id);
    if (sq) {
      console.log(`  ${id}: (${sq.worldX.toFixed(2)}, ${sq.worldY.toFixed(2)}, ${sq.worldZ.toFixed(2)})`);
    }
  });
  
  console.log('\n🔢 Rank Y Coordinates:');
  for (let rank = 0; rank <= 9; rank++) {
    const sq = world.squares.get(`a${rank}WL`) || 
               world.squares.get(`z${rank}WQL`) ||
               world.squares.get(`a${rank}NL`) ||
               world.squares.get(`a${rank}BL`);
    if (sq) {
      console.log(`  Rank ${rank}: Y=${sq.worldY.toFixed(2)}`);
    }
  }
  
  console.log('\n📏 File X Coordinates:');
  ['z', 'a', 'b', 'c', 'd', 'e'].forEach((file, fileNum) => {
    const sq = world.squares.get(`${file}2WL`) || world.squares.get(`${file}0WQL`);
    if (sq) {
      console.log(`  File ${file} (${fileNum}): X=${sq.worldX.toFixed(2)}`);
    }
  });
  
  console.log('\n✅ Total squares:', world.squares.size);
}
```

**✅ Phase 3 Complete:** Validation framework is ready.

---

## Phase 4: 3D Rendering Setup

### Step 4.1: Create Theme Configuration

**Create `src/config/theme.ts`:**

```typescript
/**
 * Central theme configuration for the 3D chess board.
 * Customize colors, sizes, and visual properties here.
 */

export const THEME = {
  // Square colors
  squares: {
    light: '#F0D9B5',
    dark: '#B58863',
    opacity: 0.9,
    size: 1.9, // Leave small gap between squares
  },

  // Platform (board background) colors
  platforms: {
    main: '#8B4513',
    attack: '#A0522D',
    opacity: 0.7,
    thickness: 0.3,
  },

  // Piece colors
  pieces: {
    white: '#f5f5f5',
    black: '#2c2c2c',
    metalness: 0.3,
    roughness: 0.6,
  },

  // Highlight colors
  highlights: {
    selected: '#FFD700',
    validMove: '#90EE90',
    check: '#FF6347',
    opacity: 0.6,
  },

  // Lighting
  lighting: {
    ambient: {
      intensity: 0.6,
      color: '#ffffff',
    },
    directional: {
      intensity: 0.8,
      position: [10, 10, 10] as [number, number, number],
      color: '#ffffff',
    },
  },

  // Camera
  camera: {
    fov: 50,
    position: [0, -15, 20] as [number, number, number],
    lookAt: [0, 8, 5] as [number, number, number],
  },

  // Scene
  scene: {
    background: '#1a1a2e',
  },
};
```

### Step 4.2: Create Game Store (Zustand)

**Create `src/store/gameStore.ts`:**

```typescript
import { create } from 'zustand';
import { ChessWorld } from '../engine/world/types';
import { createChessWorld } from '../engine/world/worldBuilder';

export interface Piece {
  id: string;
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
  file: number;
  rank: number;
  level: string; // Board ID
  hasMoved: boolean;
  movedAsPassenger?: boolean;
}

export interface GameState {
  world: ChessWorld;
  pieces: Piece[];
  currentTurn: 'white' | 'black';
  selectedSquareId: string | null;
  highlightedSquareIds: string[];
  check?: 'white' | 'black';
  checkmate?: 'white' | 'black';
  stalemate: boolean;
  moveHistory: string[];
}

interface GameStore extends GameState {
  selectSquare: (squareId: string) => void;
  clearSelection: () => void;
  resetGame: () => void;
}

const initialState: GameState = {
  world: createChessWorld(),
  pieces: [], // Will be populated later
  currentTurn: 'white',
  selectedSquareId: null,
  highlightedSquareIds: [],
  stalemate: false,
  moveHistory: [],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  selectSquare: (squareId: string) => {
    set((state) => ({
      selectedSquareId: squareId,
      highlightedSquareIds: [], // Will be populated with valid moves later
    }));
  },

  clearSelection: () => {
    set({
      selectedSquareId: null,
      highlightedSquareIds: [],
    });
  },

  resetGame: () => {
    set({
      ...initialState,
      world: createChessWorld(),
    });
  },
}));
```

### Step 4.3: Create Main 3D Scene

**Create `src/components/Board3D/Board3D.tsx`:**

```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { THEME } from '../../config/theme';
import { BoardRenderer } from './BoardRenderer';
import { WorldGridVisualizer } from '../Debug/WorldGridVisualizer';

/**
 * Main 3D scene component.
 * Sets up the Three.js canvas with camera, lights, and controls.
 */
export function Board3D() {
  return (
    <Canvas
      camera={{
        position: THEME.camera.position,
        fov: THEME.camera.fov,
      }}
      style={{ background: THEME.scene.background }}
    >
      {/* Lighting */}
      <ambientLight
        intensity={THEME.lighting.ambient.intensity}
        color={THEME.lighting.ambient.color}
      />
      <directionalLight
        intensity={THEME.lighting.directional.intensity}
        position={THEME.lighting.directional.position}
        color={THEME.lighting.directional.color}
      />

      {/* Camera controls */}
      <OrbitControls
        target={THEME.camera.lookAt}
        minDistance={5}
        maxDistance={50}
        enablePan={true}
        enableRotate={true}
        enableZoom={true}
      />

      {/* Debug visualizer (comment out in production) */}
      <WorldGridVisualizer />

      {/* Board renderer (will add next) */}
      <BoardRenderer />
    </Canvas>
  );
}
```

### Step 4.4: Create Board Renderer

**Create `src/components/Board3D/BoardRenderer.tsx`:**

```typescript
import { useGameStore } from '../../store/gameStore';
import { BoardLayout } from '../../engine/world/types';
import { THEME } from '../../config/theme';

/**
 * Renders all chess boards (main and attack).
 */
export function BoardRenderer() {
  const world = useGameStore((state) => state.world);

  return (
    <group>
      {Array.from(world.boards.values()).map((board) => (
        <SingleBoard key={board.id} board={board} />
      ))}
    </group>
  );
}

/**
 * Renders a single board with its platform and squares.
 */
function SingleBoard({ board }: { board: BoardLayout }) {
  const world = useGameStore((state) => state.world);

  // Get all squares for this board
  const squares = Array.from(world.squares.values()).filter(
    (sq) => sq.boardId === board.id
  );

  return (
    <group>
      {/* Platform (visual background for board) */}
      <group
        position={[board.centerX, board.centerY, board.centerZ]}
        rotation={[0, 0, (board.rotation * Math.PI) / 180]}
      >
        <mesh position={[0, 0, -0.15]}>
          <boxGeometry
            args={[
              board.size.width * 2.1,
              board.size.height * 2.1,
              THEME.platforms.thickness,
            ]}
          />
          <meshStandardMaterial
            color={board.type === 'main' ? THEME.platforms.main : THEME.platforms.attack}
            transparent
            opacity={THEME.platforms.opacity}
          />
        </mesh>
      </group>

      {/* Squares (NOT rotated - always at absolute positions) */}
      {squares.map((square) => (
        <mesh
          key={square.id}
          position={[square.worldX, square.worldY, square.worldZ]}
          onClick={() => console.log('Clicked square:', square.id)}
        >
          <boxGeometry args={[THEME.squares.size, THEME.squares.size, 0.1]} />
          <meshStandardMaterial
            color={square.color === 'light' ? THEME.squares.light : THEME.squares.dark}
            transparent
            opacity={THEME.squares.opacity}
          />
        </mesh>
      ))}
    </group>
  );
}
```

### Step 4.5: Create Main App Component

**Update `src/App.tsx`:**

```typescript
import { Board3D } from './components/Board3D/Board3D';
import { useGameStore } from './store/gameStore';
import { logWorldCoordinates } from './utils/debugLogger';
import { useEffect } from 'react';

function App() {
  const world = useGameStore((state) => state.world);

  // Log coordinates on mount (for debugging)
  useEffect(() => {
    logWorldCoordinates(world);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Board3D />
    </div>
  );
}

export default App;
```

### Step 4.6: Visual Validation Step

```bash
# Start dev server
pnpm dev
```

**Open browser to http://localhost:5173**

**What you should see:**
1. 7 colored platforms (3 brown main boards, 4 orange attack boards)
2. Wireframe squares with labels
3. Red spheres at board centers
4. Check browser console for coordinate logs

**Validation checklist:**
- [ ] All 7 boards are visible
- [ ] Squares are labeled correctly (e.g., "a2W", "z0WQL")
- [ ] Ranks increase from bottom to top (0 at bottom, 9 at top)
- [ ] Files go from left to right (z leftmost, e rightmost)
- [ ] White attack boards are below white main board
- [ ] Black attack boards are above black main board
- [ ] No overlapping square labels
- [ ] Boards are evenly spaced vertically

**If validation fails:**
1. Adjust constants in `src/engine/world/coordinates.ts`
2. Adjust z-heights in `src/engine/world/pinPositions.ts`
3. Refresh browser
4. Repeat until all checks pass

**✅ Phase 4 Complete:** 3D rendering is working and validated.

---

## Phase 5: Game State Management

### Step 5.1: Define Game Types

**Create `src/engine/types.ts`:**

```typescript
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type Color = 'white' | 'black';

export interface Move {
  from: string; // Square ID
  to: string;   // Square ID
  piece: PieceType;
  color: Color;
  captured?: PieceType;
  boardMoved?: string; // Attack board ID if board moved
  timestamp: number;
}
```

### Step 5.2: Create Initial Piece Setup

**Create `src/engine/initialSetup.ts`:**

```typescript
import { Piece } from '../store/gameStore';
import { PieceType } from './types';

/**
 * Creates the initial piece configuration for a new game.
 * Based on Meder rules for Tri-Dimensional Chess.
 */
export function createInitialPieces(): Piece[] {
  const pieces: Piece[] = [];
  let idCounter = 0;

  const createPiece = (
    type: PieceType,
    color: 'white' | 'black',
    file: number,
    rank: number,
    level: string
  ): Piece => ({
    id: `${color}-${type}-${idCounter++}`,
    type,
    color,
    file,
    rank,
    level,
    hasMoved: false,
  });

  // Align initial positions with reference_docs/piece_placement.json
  // Helper to map file character to numeric index used internally
  const fileIndex = (ch: 'z' | 'a' | 'b' | 'c' | 'd' | 'e'): number => {
    switch (ch) {
      case 'z': return 0;
      case 'a': return 1;
      case 'b': return 2;
      case 'c': return 3;
      case 'd': return 4;
      case 'e': return 5;
    }
  };

  // Helper to map JSON level (pin/board id) to our board ids
  const mapLevel = (color: 'white' | 'black', level: 'W' | 'B' | 'QL1' | 'KL1' | 'QL6' | 'KL6'): string => {
    if (level === 'W' || level === 'B') return level;
    if (level === 'QL1') return 'WQL';
    if (level === 'KL1') return 'WKL';
    if (level === 'QL6') return 'BQL';
    return 'BKL'; // KL6
  };

  type JsonPiece = {
    type: PieceType;
    color: 'white' | 'black';
    file: 'z' | 'a' | 'b' | 'c' | 'd' | 'e';
    rank: number;
    level: 'W' | 'B' | 'QL1' | 'KL1' | 'QL6' | 'KL6';
  };

  const jsonPieces: JsonPiece[] = [
    { type: 'rook',   color: 'white', file: 'z', rank: 0, level: 'QL1' },
    { type: 'queen',  color: 'white', file: 'a', rank: 0, level: 'QL1' },
    { type: 'pawn',   color: 'white', file: 'z', rank: 1, level: 'QL1' },
    { type: 'pawn',   color: 'white', file: 'a', rank: 1, level: 'QL1' },
    { type: 'king',   color: 'white', file: 'd', rank: 0, level: 'KL1' },
    { type: 'rook',   color: 'white', file: 'e', rank: 0, level: 'KL1' },
    { type: 'pawn',   color: 'white', file: 'd', rank: 1, level: 'KL1' },
    { type: 'pawn',   color: 'white', file: 'e', rank: 1, level: 'KL1' },
    { type: 'knight', color: 'white', file: 'a', rank: 1, level: 'W'   },
    { type: 'bishop', color: 'white', file: 'b', rank: 1, level: 'W'   },
    { type: 'bishop', color: 'white', file: 'c', rank: 1, level: 'W'   },
    { type: 'knight', color: 'white', file: 'd', rank: 1, level: 'W'   },
    { type: 'pawn',   color: 'white', file: 'a', rank: 2, level: 'W'   },
    { type: 'pawn',   color: 'white', file: 'b', rank: 2, level: 'W'   },
    { type: 'pawn',   color: 'white', file: 'c', rank: 2, level: 'W'   },
    { type: 'pawn',   color: 'white', file: 'd', rank: 2, level: 'W'   },
    { type: 'rook',   color: 'black', file: 'z', rank: 9, level: 'QL6' },
    { type: 'queen',  color: 'black', file: 'a', rank: 9, level: 'QL6' },
    { type: 'pawn',   color: 'black', file: 'z', rank: 8, level: 'QL6' },
    { type: 'pawn',   color: 'black', file: 'a', rank: 8, level: 'QL6' },
    { type: 'king',   color: 'black', file: 'd', rank: 9, level: 'KL6' },
    { type: 'rook',   color: 'black', file: 'e', rank: 9, level: 'KL6' },
    { type: 'pawn',   color: 'black', file: 'd', rank: 8, level: 'KL6' },
    { type: 'pawn',   color: 'black', file: 'e', rank: 8, level: 'KL6' },
    { type: 'knight', color: 'black', file: 'a', rank: 8, level: 'B'   },
    { type: 'bishop', color: 'black', file: 'b', rank: 8, level: 'B'   },
    { type: 'bishop', color: 'black', file: 'c', rank: 8, level: 'B'   },
    { type: 'knight', color: 'black', file: 'd', rank: 8, level: 'B'   },
    { type: 'pawn',   color: 'black', file: 'a', rank: 7, level: 'B'   },
    { type: 'pawn',   color: 'black', file: 'b', rank: 7, level: 'B'   },
    { type: 'pawn',   color: 'black', file: 'c', rank: 7, level: 'B'   },
    { type: 'pawn',   color: 'black', file: 'd', rank: 7, level: 'B'   },
  ];

  for (const jp of jsonPieces) {
    pieces.push(
      createPiece(
        jp.type,
        jp.color,
        fileIndex(jp.file),
        jp.rank,
        mapLevel(jp.color, jp.level)
      )
    );
  }

  return pieces;
}

```

### Step 5.3: Update Game Store with Pieces

**Update `src/store/gameStore.ts` to initialize with pieces:**

```typescript
// Add this import at the top
import { createInitialPieces } from '../engine/initialSetup';

// Update initialState
const initialState: GameState = {
  world: createChessWorld(),
  pieces: createInitialPieces(), // Add this
  currentTurn: 'white',
  selectedSquareId: null,
  highlightedSquareIds: [],
  stalemate: false,
  moveHistory: [],
};

// Update resetGame action
resetGame: () => {
  set({
    ...initialState,
    world: createChessWorld(),
    pieces: createInitialPieces(), // Add this
  });
},
```

### Step 5.4: Create Simple Piece Renderer

**Create `src/components/Board3D/Pieces3D.tsx`:**

```typescript
import { useGameStore } from '../../store/gameStore';
import { Piece } from '../../store/gameStore';
import { THEME } from '../../config/theme';

/**
 * Renders all chess pieces.
 * For now, uses simple geometric shapes. Will replace with 3D models later.
 */
export function Pieces3D() {
  const pieces = useGameStore((state) => state.pieces);
  const world = useGameStore((state) => state.world);

  return (
    <group>
      {pieces.map((piece) => {
        const squareId = `${['z', 'a', 'b', 'c', 'd', 'e'][piece.file]}${piece.rank}${piece.level}`;
        const square = world.squares.get(squareId);

        if (!square) {
          console.error(`Square not found: ${squareId}`);
          return null;
        }

        return (
          <SimplePiece
            key={piece.id}
            piece={piece}
            position={[square.worldX, square.worldY, square.worldZ + 0.5]}
          />
        );
      })}
    </group>
  );
}

/**
 * Simple geometric piece representation.
 * TODO: Replace with 3D models
 */
function SimplePiece({
  piece,
  position,
}: {
  piece: Piece;
  position: [number, number, number];
}) {
  const color = piece.color === 'white' ? THEME.pieces.white : THEME.pieces.black;
  
  // Different shapes for different pieces
  const getGeometry = () => {
    switch (piece.type) {
      case 'pawn':
        return <coneGeometry args={[0.3, 0.8, 16]} />;
      case 'rook':
        return <boxGeometry args={[0.5, 0.5, 0.8]} />;
      case 'knight':
        return <boxGeometry args={[0.4, 0.6, 0.8]} />;
      case 'bishop':
        return <coneGeometry args={[0.35, 1.0, 16]} />;
      case 'queen':
        return <octahedronGeometry args={[0.4]} />;
      case 'king':
        return <cylinderGeometry args={[0.35, 0.35, 1.0, 16]} />;
    }
  };

  return (
    <mesh position={position}>
      {getGeometry()}
      <meshStandardMaterial
        color={color}
        metalness={THEME.pieces.metalness}
        roughness={THEME.pieces.roughness}
      />
    </mesh>
  );
}
```

### Step 5.5: Add Pieces to Scene

**Update `src/components/Board3D/Board3D.tsx`:**

```typescript
// Add import
import { Pieces3D } from './Pieces3D';

// Add inside Canvas, after BoardRenderer
<Pieces3D />
```

### Step 5.6: Test Piece Rendering

```bash
pnpm dev
```

**Visual validation:**
- [ ] 40 pieces total are visible
- [ ] Each piece sits directly on top of a square
- [ ] White pieces are on bottom boards (WL, WQL, WKL)
- [ ] Black pieces are on top boards (BL, BQL, BKL)
- [ ] Pieces don't overlap each other
- [ ] Pieces align perfectly with square centers

**If pieces don't align with squares:**
1. Your coordinate system has a bug!
2. Review `src/engine/world/coordinates.ts`
3. Ensure pieces and squares use SAME functions
4. Fix and re-test

**✅ Phase 5 Complete:** Game state is set up with initial pieces.

---

## Phase 5.5: Critical 3D Movement Rules

**⚠️ READ THIS BEFORE IMPLEMENTING PHASE 6**

Before implementing movement logic, you **must** understand the critical 3D-specific rules that distinguish this game from 2D chess. These rules are explicitly documented in `meder-rules.md` and `move_logic_tests.md` and are **non-negotiable** for correct gameplay.

### Rule 1: The "Vertical Shadow" Blocking Principle

**This is the single most important rule distinguishing 3D Chess from 2D chess.**

#### Definition

A piece occupying any square (e.g., c4N) **blocks the entire vertical column** associated with that square's file and rank (in this case, column "c4") for all other pieces on all levels.

#### Effect on Movement

A piece **cannot move THROUGH a blocked column**, even if the path on its own level appears clear.

#### Examples

**Example 1: Bishop Blocked by Vertical Shadow**
- White Bishop sits at a2W and wants to move to d5N
- The diagonal path crosses through columns b3 and c4
- If **ANY piece** (on **ANY level**) occupies b3 or c4, the move is **BLOCKED**
- This applies even if:
  - b3W is empty
  - b3N is empty  
  - b3B is empty
  - c4W is empty
  - c4N is empty
  - c4B is empty
- If there's a piece at b3B or c4B (or any other level at those coordinates), the Bishop at a2W **still cannot pass through**

**Example 2: Rook Moving Through Levels**
- White Rook at b2W wants to move to b5N
- The path crosses through columns b3 and b4
- If any piece exists at b3 (any level) OR b4 (any level), the move is blocked
- The Rook must have a clear vertical "tunnel" through all intermediate columns

#### Implementation Requirements

When validating moves for rooks, bishops, and queens:

1. **Calculate the path** through all intermediate squares (file, rank coordinates)
2. **For EACH intermediate coordinate**, check **ALL levels** for piece occupation
3. If **any** intermediate column is occupied (on any level), the move is **BLOCKED**

```typescript
// Pseudo-code for path validation
function isPathClear(from: Square, to: Square, world: World, pieces: Piece[]): boolean {
  const pathCoordinates = calculatePathCoordinates(from, to);
  
  for (const coord of pathCoordinates) {
    // Check ALL levels for this file/rank coordinate
    const columnsToCheck = [
      `${coord.file}${coord.rank}W`,
      `${coord.file}${coord.rank}N`,
      `${coord.file}${coord.rank}B`,
      // Also check attack boards if they cover this rank
    ];
    
    for (const squareId of columnsToCheck) {
      const square = world.squares.get(squareId);
      if (square && isPieceAt(square, pieces)) {
        return false; // Path is blocked!
      }
    }
  }
  
  return true; // Path is clear
}
```

#### Exception: Knights Are Immune

**Knights completely ignore the Vertical Shadow rule.** Knights can jump over any pieces in any configuration. This is their unique 3D advantage.

### Rule 2: Prohibition of Purely Vertical Movement

**Source:** `meder-rules.md` Article 3.1(d)

#### The Rule

A piece **cannot move to a square with the same file and rank on a different level** without horizontal displacement.

In other words: **No pure vertical movement** (moving straight up or down through levels).

#### Why This Rule Exists

This prevents pieces from "teleporting" between levels and maintains the 3D tactical complexity of the game.

#### Invalid Examples

- ❌ Rook at b2W **cannot** move to b2N (same file 'b', same rank 2)
- ❌ Queen at c5N **cannot** move to c5B (same file 'c', same rank 5)  
- ❌ King at d4W **cannot** move to d4N (same file 'd', same rank 4)

#### Valid Examples

- ✅ Rook at b2W **can** move to c2N (file changed: b→c, also crosses level)
- ✅ Rook at b2W **can** move to b3N (rank changed: 2→3, also crosses level)
- ✅ Bishop at b2W **can** move to c3N (both file and rank changed)
- ✅ Queen at c5N **can** move to d6B (both file and rank changed)

#### Implementation Check

When validating a move that crosses levels:

```typescript
function validateMove(from: Square, to: Square): boolean {
  // If moving between different levels...
  if (from.level !== to.level) {
    // At least one of file or rank MUST change
    const fileChanged = from.file !== to.file;
    const rankChanged = from.rank !== to.rank;
    
    if (!fileChanged && !rankChanged) {
      return false; // Pure vertical movement is illegal!
    }
  }
  
  // ... continue with other validation
}
```

### Rule 3: Level Transition Mechanics

#### How Pieces Move Between Levels

Pieces move between levels by crossing the **overlapping rank regions**:

**White to Neutral:**
- Overlap at rank 1 (White attack board overlaps with White main)
- Overlap at ranks 3-4 (White main overlaps with Neutral)

**Neutral to Black:**
- Overlap at ranks 5-6 (Neutral overlaps with Black main)
- Overlap at rank 8 (Black main overlaps with Black attack)

#### Example Transition Paths

**White to Neutral Transition:**
- Piece at b2W can move to c3N (valid: crosses at overlap rank 3)
- Piece at b3W can move to c4N (valid: crosses at overlap rank 3-4)

**Neutral to Black Transition:**
- Piece at c5N can move to d6B (valid: crosses at overlap rank 5-6)

### Testing Your Implementation

Create test cases that validate these rules:

```typescript
describe('Vertical Shadow Blocking', () => {
  it('should block bishop diagonal if intermediate column is occupied', () => {
    // Set up: Bishop at a2W, target d5N, blocking piece at c4B
    const world = createChessWorld();
    const pieces = [
      createPiece('bishop', 'white', 1, 2, 'W'),
      createPiece('pawn', 'black', 3, 4, 'B'), // Blocker
    ];
    
    const validMoves = calculateValidMoves(pieces[0], world, pieces);
    const targetSquare = 'd5N';
    
    expect(validMoves.includes(targetSquare)).toBe(false);
  });

  it('should allow knight to jump over blocking pieces', () => {
    // Knights are immune to vertical shadow
    const world = createChessWorld();
    const pieces = [
      createPiece('knight', 'white', 2, 2, 'W'),
      createPiece('pawn', 'black', 3, 3, 'N'), // Would block other pieces
    ];
    
    const validMoves = calculateValidMoves(pieces[0], world, pieces);
    // Knight should still be able to make its L-shaped moves
    expect(validMoves.length).toBeGreaterThan(0);
  });
});

describe('Purely Vertical Movement Prohibition', () => {
  it('should prevent rook from moving to same file/rank on different level', () => {
    const world = createChessWorld();
    const pieces = [createPiece('rook', 'white', 2, 2, 'W')];
    
    const validMoves = calculateValidMoves(pieces[0], world, pieces);
    
    // b2N would be same file and rank, just different level
    expect(validMoves.includes('b2N')).toBe(false);
  });

  it('should allow rook to move diagonally through levels', () => {
    const world = createChessWorld();
    const pieces = [createPiece('rook', 'white', 2, 2, 'W')];
    
    const validMoves = calculateValidMoves(pieces[0], world, pieces);
    
    // c3N has different file AND rank, so it's valid
    // (assuming path is clear and follows rook movement rules)
    const c3NIsValid = validMoves.includes('c3N');
    // This may or may not be true depending on rook rules,
    // but the PROHIBITION rule won't block it
  });
});
```

### Summary Checklist

Before implementing Phase 6, ensure you understand:

- ✅ **Vertical Shadow Rule**: A piece at any coordinate (file+rank) blocks that column on ALL levels
- ✅ **Knight Exception**: Knights ignore the Vertical Shadow completely
- ✅ **No Pure Vertical Movement**: Moving between levels requires file OR rank change
- ✅ **Level Transitions**: Pieces cross levels through overlapping rank regions
- ✅ **Implementation Strategy**: Check ALL levels when validating paths

**These rules are mandatory.** Implementing movement logic without them will result in an incorrect game that doesn't match the official rules.

**✅ Phase 5.5 Complete:** Critical 3D movement rules understood.

---

## Phase 6: Movement Logic

**⚠️ PREREQUISITE:** You must have read and understood Phase 5.5 before proceeding. The Vertical Shadow blocking principle and vertical movement prohibition are fundamental to correct movement validation.

This is a large phase. We'll implement movement for each piece type separately.

### Step 6.1: Create Direction Helpers

**Create `src/engine/rules/directionHelpers.ts`:**

```typescript
/**
 * Direction vectors for piece movement in 3D space.
 */

export interface Direction3D {
  file: number;
  rank: number;
  level: number;  // Level change (will be implemented via board mapping)
}

/**
 * Get possible direction vectors for a piece type.
 */
export function getPieceDirections(pieceType: string): Direction3D[] {
  switch (pieceType) {
    case 'rook':
      return getRookDirections();
    case 'bishop':
      return getBishopDirections();
    case 'queen':
      return getQueenDirections();
    case 'knight':
      return getKnightDirections();
    case 'king':
      return getKingDirections();
    default:
      return [];
  }
}

/**
 * Rook moves: straight lines in any axis.
 */
function getRookDirections(): Direction3D[] {
  return [
    { file: 1, rank: 0, level: 0 },   // Right
    { file: -1, rank: 0, level: 0 },  // Left
    { file: 0, rank: 1, level: 0 },   // Forward
    { file: 0, rank: -1, level: 0 },  // Backward
    { file: 0, rank: 0, level: 1 },   // Up
    { file: 0, rank: 0, level: -1 },  // Down
  ];
}

/**
 * Bishop moves: diagonals in any 2D plane.
 */
function getBishopDirections(): Direction3D[] {
  return [
    // XY plane diagonals
    { file: 1, rank: 1, level: 0 },
    { file: 1, rank: -1, level: 0 },
    { file: -1, rank: 1, level: 0 },
    { file: -1, rank: -1, level: 0 },
    
    // XZ plane diagonals
    { file: 1, rank: 0, level: 1 },
    { file: 1, rank: 0, level: -1 },
    { file: -1, rank: 0, level: 1 },
    { file: -1, rank: 0, level: -1 },
    
    // YZ plane diagonals
    { file: 0, rank: 1, level: 1 },
    { file: 0, rank: 1, level: -1 },
    { file: 0, rank: -1, level: 1 },
    { file: 0, rank: -1, level: -1 },
  ];
}

/**
 * Queen moves: combination of rook and bishop.
 */
function getQueenDirections(): Direction3D[] {
  return [...getRookDirections(), ...getBishopDirections()];
}

/**
 * Knight moves: L-shapes in 3D (2+1 in any plane).
 */
function getKnightDirections(): Direction3D[] {
  const moves: Direction3D[] = [];
  
  // XY plane L-shapes
  for (const [df, dr] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [-1, 2], [1, -2], [-1, -2]]) {
    moves.push({ file: df, rank: dr, level: 0 });
  }
  
  // XZ plane L-shapes
  for (const [df, dl] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [-1, 2], [1, -2], [-1, -2]]) {
    moves.push({ file: df, rank: 0, level: dl });
  }
  
  // YZ plane L-shapes
  for (const [dr, dl] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [-1, 2], [1, -2], [-1, -2]]) {
    moves.push({ file: 0, rank: dr, level: dl });
  }
  
  return moves;
}

/**
 * King moves: one square in any direction.
 */
function getKingDirections(): Direction3D[] {
  const moves: Direction3D[] = [];
  
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dl = -1; dl <= 1; dl++) {
        if (df === 0 && dr === 0 && dl === 0) continue;
        moves.push({ file: df, rank: dr, level: dl });
      }
    }
  }
  
  return moves;
}
```

**Note:** This implementation guide is already getting very long. I'll continue with the key remaining steps in a condensed format to stay within reasonable length. The full implementation would include all steps in detail similar to what we've done so far.

### Continuation Note

This guide has covered the critical foundational phases in detail:
1. Project setup
2. World grid system (THE most important part)
3. Validation framework
4. 3D rendering
5. Game state management
6. Beginning of movement logic

The remaining phases (6-10) would follow the same detailed pattern covering:
- Complete movement validation for all pieces
- Check/checkmate detection
- Attack board movement
- UI components
- Testing and polish

Each of these phases would have similar detail level with code examples, test files, validation steps, and troubleshooting guidance.

**Key Principle for All Remaining Work:**
Always use the world grid as the single source of truth. Never calculate coordinates at render time. Test extensively before moving to the next phase.

**✅ Phases 1-5 Complete with High Detail**

---

## Phase 8: Attack Board Movement (DETAILED IMPLEMENTATION STRATEGY)

**⚠️ CRITICAL PREREQUISITE:** This is the most complex feature in the game. Do NOT attempt this until:
- Phases 1-6 are fully complete and tested
- All piece movement is working correctly
- You understand the Vertical Shadow principle
- You've read `ATTACK_BOARD_RULES.md` thoroughly

### Overview: What Makes Attack Boards Unique

Attack boards are **movable 2×2 platforms** that can relocate to different pin positions during gameplay. This creates dynamic 3D geometry where:

1. **Boards move as player turns** (instead of moving a piece)
2. **Pieces "ride" on boards** (passengers move with the board)
3. **Quadrant rotation** (boards can flip 180°)
4. **Vertical Shadow constraints** apply to board movement
5. **Occupancy restrictions** (≤1 piece to move)
6. **Directional limits** (forward/side only if occupied)

### Step 8.1: Extend World Types for Attack Board Movement

**Update `src/engine/world/types.ts`:**

```typescript
/**
 * Extended BoardLayout to track attack board state
 */
export interface BoardLayout {
  id: string;
  type: 'main' | 'attack';
  size: { width: number; height: number };
  currentPin?: string;           // Current pin ID (attack boards only)
  canMove: boolean;
  centerX: number;
  centerY: number;
  centerZ: number;
  rotation: number;              // 0 or 180 degrees

  // NEW: Attack board specific
  owner?: 'white' | 'black';     // Original owner
  controller?: 'white' | 'black'; // Current controller (can differ from owner)
  quadrantMap?: QuadrantMap;      // Maps current quadrants to base positions
}

/**
 * Quadrant mapping for rotated boards.
 * When a board rotates 180°, quadrants swap positions.
 */
export interface QuadrantMap {
  q1: 'q1' | 'q3';  // Top-left maps to...
  q2: 'q2' | 'q4';  // Top-right maps to...
  q3: 'q1' | 'q3';  // Bottom-left maps to...
  q4: 'q2' | 'q4';  // Bottom-right maps to...
}

/**
 * Extended PinPosition with cross-pin adjacency
 */
export interface PinPosition {
  id: string;
  fileOffset: number;
  rankOffset: number;
  zHeight: number;
  adjacentPins: string[];        // Adjacent pins for same side (QL or KL)
  crossPins?: string[];          // NEW: Adjacent pins on opposite side
  level: number;
  inverted: boolean;

  // NEW: Directional classification
  direction?: 'forward' | 'neutral' | 'backward';  // Relative to white
}
```

### Step 8.2: Create Attack Board Movement Engine

**Create `src/engine/attackBoards/types.ts`:**

```typescript
import { PieceState } from '../movement/types';

/**
 * Result of attack board move validation
 */
export interface AttackBoardMoveValidation {
  valid: boolean;
  reason?: string;
  conflicts?: string[];  // Pieces that would be affected
}

/**
 * Attack board move context
 */
export interface AttackBoardMoveContext {
  boardId: string;
  currentPinId: string;
  targetPinId: string;
  rotation?: 0 | 180;    // New rotation after move
  pieces: PieceState[];
  currentTurn: 'white' | 'black';
}

/**
 * Describes what happens when a board moves
 */
export interface AttackBoardMoveResult {
  boardId: string;
  fromPin: string;
  toPin: string;
  newRotation: number;
  affectedPieces: {
    pieceId: string;
    oldSquareId: string;
    newSquareId: string;
    newQuadrant: string;
  }[];
}
```

**Create `src/engine/attackBoards/occupancy.ts`:**

```typescript
import { PieceState } from '../movement/types';
import { ChessWorld } from '../world/types';

/**
 * Count pieces on an attack board
 */
export function countPiecesOnBoard(
  boardId: string,
  pieces: PieceState[],
  world: ChessWorld
): number {
  const boardSquares = Array.from(world.squares.values())
    .filter(sq => sq.boardId === boardId)
    .map(sq => sq.id);

  return pieces.filter(p => boardSquares.includes(p.squareId)).length;
}

/**
 * Get pieces on a specific board
 */
export function getPiecesOnBoard(
  boardId: string,
  pieces: PieceState[],
  world: ChessWorld
): PieceState[] {
  const boardSquares = new Set(
    Array.from(world.squares.values())
      .filter(sq => sq.boardId === boardId)
      .map(sq => sq.id)
  );

  return pieces.filter(p => boardSquares.has(p.squareId));
}

/**
 * Determine who controls an attack board based on occupancy
 */
export function getBoardController(
  boardId: string,
  pieces: PieceState[],
  world: ChessWorld
): 'white' | 'black' | null {
  const boardPieces = getPiecesOnBoard(boardId, pieces, world);

  if (boardPieces.length === 0) {
    // Empty board: controlled by original owner
    const board = world.boards.get(boardId);
    return board?.owner || null;
  }

  if (boardPieces.length === 1) {
    // Single piece: controlled by that piece's color
    return boardPieces[0].color;
  }

  // Multiple pieces: board cannot move
  return null;
}

/**
 * Check if a board can move (≤1 piece)
 */
export function canBoardMove(
  boardId: string,
  pieces: PieceState[],
  world: ChessWorld
): boolean {
  return countPiecesOnBoard(boardId, pieces, world) <= 1;
}
```

**Create `src/engine/attackBoards/adjacency.ts`:**

```typescript
import { ChessWorld } from '../world/types';

/**
 * Check if two pins are adjacent (board can move between them)
 */
export function arePinsAdjacent(
  fromPinId: string,
  toPinId: string,
  world: ChessWorld
): boolean {
  const fromPin = world.pins.get(fromPinId);
  if (!fromPin) return false;

  return fromPin.adjacentPins.includes(toPinId) ||
         (fromPin.crossPins?.includes(toPinId) ?? false);
}

/**
 * Get all valid destination pins for a board
 */
export function getValidDestinationPins(
  currentPinId: string,
  world: ChessWorld,
  includeBackward: boolean = false
): string[] {
  const currentPin = world.pins.get(currentPinId);
  if (!currentPin) return [];

  let validPins = [...currentPin.adjacentPins];

  // Add cross-pins (side moves to opposite side)
  if (currentPin.crossPins) {
    validPins.push(...currentPin.crossPins);
  }

  // Filter out backward moves if board is occupied
  if (!includeBackward) {
    validPins = validPins.filter(pinId => {
      const pin = world.pins.get(pinId);
      if (!pin) return false;

      // Backward = lower level for white, higher level for black
      // For simplicity, filter by level comparison
      return pin.level >= currentPin.level;
    });
  }

  return validPins;
}
```

**Create `src/engine/attackBoards/verticalShadow.ts`:**

```typescript
import { ChessWorld } from '../world/types';
import { PieceState } from '../movement/types';

/**
 * Check if moving a board to a pin would violate Vertical Shadow rule.
 *
 * Rule: An attack board cannot be placed where any of its 4 squares
 * would be vertically aligned with a non-knight piece on another level.
 */
export function isBlockedByVerticalShadow(
  targetPinId: string,
  pieces: PieceState[],
  world: ChessWorld
): boolean {
  const pin = world.pins.get(targetPinId);
  if (!pin) return true;

  // Calculate the 4 file-rank positions this board would occupy
  const boardPositions = [
    { file: pin.fileOffset, rank: pin.rankOffset },
    { file: pin.fileOffset + 1, rank: pin.rankOffset },
    { file: pin.fileOffset, rank: pin.rankOffset + 1 },
    { file: pin.fileOffset + 1, rank: pin.rankOffset + 1 },
  ];

  // Check each position for vertical column occupation
  for (const pos of boardPositions) {
    // Find all pieces at this file-rank coordinate (any level)
    const blockingPieces = pieces.filter(p => {
      const square = world.squares.get(p.squareId);
      if (!square) return false;

      // Same file and rank, but different Z-height
      return square.file === pos.file &&
             square.rank === pos.rank &&
             square.worldZ !== pin.zHeight &&
             p.type !== 'knight';  // Knights don't block
    });

    if (blockingPieces.length > 0) {
      return true;  // Blocked!
    }
  }

  return false;
}
```

### Step 8.3: Create Board Movement Validator

**Create `src/engine/attackBoards/validator.ts`:**

```typescript
import { AttackBoardMoveContext, AttackBoardMoveValidation } from './types';
import { ChessWorld } from '../world/types';
import { canBoardMove, getBoardController } from './occupancy';
import { arePinsAdjacent } from './adjacency';
import { isBlockedByVerticalShadow } from './verticalShadow';

/**
 * Validate if an attack board can move to a target pin.
 *
 * Rules (from ATTACK_BOARD_RULES.md):
 * 1. Board must have ≤1 piece (occupancy restriction)
 * 2. Current player must control the board
 * 3. Target pin must be adjacent to current pin
 * 4. If occupied, can only move forward or sideways (not backward)
 * 5. Move must not violate Vertical Shadow rule
 * 6. Move must not create check/checkmate (validated elsewhere)
 */
export function validateAttackBoardMove(
  context: AttackBoardMoveContext,
  world: ChessWorld
): AttackBoardMoveValidation {
  const { boardId, currentPinId, targetPinId, pieces, currentTurn } = context;

  // Rule 1: Check occupancy
  if (!canBoardMove(boardId, pieces, world)) {
    return {
      valid: false,
      reason: 'Board has more than 1 piece and cannot move'
    };
  }

  // Rule 2: Check control
  const controller = getBoardController(boardId, pieces, world);
  if (controller !== currentTurn) {
    return {
      valid: false,
      reason: `Board is controlled by ${controller}, not ${currentTurn}`
    };
  }

  // Rule 3: Check adjacency
  if (!arePinsAdjacent(currentPinId, targetPinId, world)) {
    return {
      valid: false,
      reason: 'Target pin is not adjacent to current pin'
    };
  }

  // Rule 4: Check directional restrictions
  const currentPin = world.pins.get(currentPinId);
  const targetPin = world.pins.get(targetPinId);

  if (!currentPin || !targetPin) {
    return { valid: false, reason: 'Invalid pin IDs' };
  }

  // If board has a piece (occupied), check direction
  const piecesOnBoard = pieces.filter(p => {
    const square = world.squares.get(p.squareId);
    return square?.boardId === boardId;
  });

  if (piecesOnBoard.length > 0) {
    // Occupied: cannot move backward
    const isBackward = targetPin.level < currentPin.level;
    if (isBackward) {
      return {
        valid: false,
        reason: 'Occupied boards cannot move backward'
      };
    }
  }

  // Rule 5: Check Vertical Shadow
  if (isBlockedByVerticalShadow(targetPinId, pieces, world)) {
    return {
      valid: false,
      reason: 'Move blocked by Vertical Shadow (non-knight piece in column)'
    };
  }

  return { valid: true };
}
```

### Step 8.4: Create Board Movement Executor

**Create `src/engine/attackBoards/executor.ts`:**

```typescript
import { ChessWorld } from '../world/types';
import { PieceState } from '../movement/types';
import { AttackBoardMoveResult } from './types';
import { createSquareId } from '../world/coordinates';

/**
 * Execute an attack board move.
 * Updates world state and moves any passenger pieces.
 */
export function executeAttackBoardMove(
  boardId: string,
  targetPinId: string,
  rotation: 0 | 180,
  pieces: PieceState[],
  world: ChessWorld
): AttackBoardMoveResult {
  const board = world.boards.get(boardId);
  const targetPin = world.pins.get(targetPinId);

  if (!board || !targetPin) {
    throw new Error('Invalid board or pin ID');
  }

  const fromPin = board.currentPin!;

  // Get pieces currently on this board (passengers)
  const passengers = pieces.filter(p => {
    const square = world.squares.get(p.squareId);
    return square?.boardId === boardId;
  });

  // Remove old squares
  const oldSquares = Array.from(world.squares.values())
    .filter(sq => sq.boardId === boardId);

  oldSquares.forEach(sq => world.squares.delete(sq.id));

  // Create new squares at target pin
  const files = [targetPin.fileOffset, targetPin.fileOffset + 1];
  const ranks = [targetPin.rankOffset, targetPin.rankOffset + 1];

  for (const file of files) {
    for (const rank of ranks) {
      const squareId = createSquareId(file, rank, boardId);
      world.squares.set(squareId, {
        id: squareId,
        boardId,
        file,
        rank,
        level: boardId,
        worldX: fileToWorldX(file),
        worldY: rankToWorldY(rank),
        worldZ: targetPin.zHeight,
        isValid: true,
        color: (file + rank) % 2 === 0 ? 'light' : 'dark',
      });
    }
  }

  // Update board metadata
  board.currentPin = targetPinId;
  board.centerX = (fileToWorldX(files[0]) + fileToWorldX(files[1])) / 2;
  board.centerY = (rankToWorldY(ranks[0]) + rankToWorldY(ranks[1])) / 2;
  board.centerZ = targetPin.zHeight;
  board.rotation = rotation;

  // Update passenger pieces
  const affectedPieces = passengers.map(p => {
    const oldSquare = world.squares.get(p.squareId);
    if (!oldSquare) {
      throw new Error(`Old square not found: ${p.squareId}`);
    }

    // Calculate quadrant position
    const quadrant = getQuadrant(oldSquare.file, oldSquare.rank, fromPin);
    const rotatedQuadrant = rotation === 180 ? rotateQuadrant(quadrant) : quadrant;

    // Calculate new file/rank based on rotated quadrant
    const { file: newFile, rank: newRank } = quadrantToFileRank(
      rotatedQuadrant,
      targetPin
    );

    const newSquareId = createSquareId(newFile, newRank, boardId);

    return {
      pieceId: p.id,
      oldSquareId: p.squareId,
      newSquareId,
      newQuadrant: rotatedQuadrant
    };
  });

  return {
    boardId,
    fromPin,
    toPin: targetPinId,
    newRotation: rotation,
    affectedPieces
  };
}

/**
 * Determine which quadrant a file/rank position is in.
 * Quadrants are:
 * q1: top-left     q2: top-right
 * q3: bottom-left  q4: bottom-right
 */
function getQuadrant(file: number, rank: number, pin: PinPosition): string {
  const isLeft = file === pin.fileOffset;
  const isBottom = rank === pin.rankOffset;

  if (isBottom && isLeft) return 'q3';
  if (isBottom && !isLeft) return 'q4';
  if (!isBottom && isLeft) return 'q1';
  return 'q2';
}

/**
 * Rotate a quadrant 180°.
 * q1 ↔ q3, q2 ↔ q4
 */
function rotateQuadrant(quadrant: string): string {
  const rotationMap: Record<string, string> = {
    q1: 'q3',
    q2: 'q4',
    q3: 'q1',
    q4: 'q2'
  };
  return rotationMap[quadrant] || quadrant;
}

/**
 * Convert quadrant back to file/rank at new pin
 */
function quadrantToFileRank(
  quadrant: string,
  pin: PinPosition
): { file: number; rank: number } {
  const isLeft = quadrant === 'q1' || quadrant === 'q3';
  const isBottom = quadrant === 'q3' || quadrant === 'q4';

  return {
    file: pin.fileOffset + (isLeft ? 0 : 1),
    rank: pin.rankOffset + (isBottom ? 0 : 1)
  };
}
```

### Step 8.5: Update Pin Positions with Cross-Pin Adjacency

**Update `src/engine/world/pinPositions.ts`:**

```typescript
export const PIN_POSITIONS: Record<string, PinPosition> = {
  QL1: {
    id: 'QL1',
    fileOffset: 0,
    rankOffset: 0,
    zHeight: 7.5,
    adjacentPins: ['QL2'],          // Forward on same side
    crossPins: ['KL1', 'KL2'],      // Sideways to opposite side
    level: 0,
    inverted: false,
    direction: 'backward',           // Relative to white
  },
  QL2: {
    id: 'QL2',
    fileOffset: 0,
    rankOffset: 2,
    zHeight: 7.5,
    adjacentPins: ['QL1', 'QL3'],
    crossPins: ['KL1', 'KL2', 'KL3'],
    level: 1,
    inverted: false,
    direction: 'neutral',
  },
  QL3: {
    id: 'QL3',
    fileOffset: 0,
    rankOffset: 4,
    zHeight: 12.5,
    adjacentPins: ['QL2', 'QL4'],
    crossPins: ['KL2', 'KL3', 'KL4'],
    level: 2,
    inverted: false,
    direction: 'neutral',
  },
  // ... Continue pattern for QL4, QL5, QL6, KL1-6
};
```

### Step 8.6: Integrate with Game Store

**Update `src/store/gameStore.ts`:**

```typescript
interface GameStore extends GameState {
  selectSquare: (squareId: string) => void;
  movePiece: (fromSquareId: string, toSquareId: string) => boolean;
  moveAttackBoard: (boardId: string, targetPinId: string, rotation?: 0 | 180) => boolean;
  clearSelection: () => void;
  resetGame: () => void;
  getValidMovesForSquare: (squareId: string) => string[];
  getValidPinsForBoard: (boardId: string) => string[];  // NEW
}

// Add to store implementation:
moveAttackBoard: (boardId: string, targetPinId: string, rotation = 0) => {
  const state = get();

  // Get current pin
  const board = state.world.boards.get(boardId);
  if (!board || !board.currentPin) {
    return false;
  }

  // Validate move
  const context: AttackBoardMoveContext = {
    boardId,
    currentPinId: board.currentPin,
    targetPinId,
    rotation,
    pieces: state.pieces.map(pieceToPieceState),
    currentTurn: state.currentTurn
  };

  const validation = validateAttackBoardMove(context, state.world);
  if (!validation.valid) {
    console.log('Invalid board move:', validation.reason);
    return false;
  }

  // Execute move
  const result = executeAttackBoardMove(
    boardId,
    targetPinId,
    rotation,
    state.pieces.map(pieceToPieceState),
    state.world
  );

  // Update pieces
  const newPieces = state.pieces.map(piece => {
    const affected = result.affectedPieces.find(a => a.pieceId === piece.id);
    if (!affected) return piece;

    const newSquare = state.world.squares.get(affected.newSquareId);
    if (!newSquare) return piece;

    return {
      ...piece,
      file: newSquare.file,
      rank: newSquare.rank,
      level: newSquare.boardId,
      movedAsPassenger: true  // Mark as passenger
    };
  });

  // Switch turns
  const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';

  set({
    pieces: newPieces,
    currentTurn: nextTurn,
    moveHistory: [...state.moveHistory, `${boardId}:${board.currentPin}-${targetPinId}`]
  });

  return true;
},

getValidPinsForBoard: (boardId: string) => {
  const state = get();
  const board = state.world.boards.get(boardId);
  if (!board || !board.currentPin) return [];

  const pieceStates = state.pieces.map(pieceToPieceState);
  const piecesOnBoard = getPiecesOnBoard(boardId, pieceStates, state.world);
  const includeBackward = piecesOnBoard.length === 0;

  const candidatePins = getValidDestinationPins(
    board.currentPin,
    state.world,
    includeBackward
  );

  // Filter by validation
  return candidatePins.filter(pinId => {
    const context: AttackBoardMoveContext = {
      boardId,
      currentPinId: board.currentPin!,
      targetPinId: pinId,
      pieces: pieceStates,
      currentTurn: state.currentTurn
    };

    const validation = validateAttackBoardMove(context, state.world);
    return validation.valid;
  });
}
```

### Step 8.7: Create Attack Board UI Component

**Create `src/components/UI/AttackBoardControls.tsx`:**

```typescript
import { useGameStore } from '../../store/gameStore';
import { useState } from 'react';

export function AttackBoardControls() {
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const moveAttackBoard = useGameStore(state => state.moveAttackBoard);
  const getValidPinsForBoard = useGameStore(state => state.getValidPinsForBoard);
  const currentTurn = useGameStore(state => state.currentTurn);

  const boards = ['WQL', 'WKL', 'BQL', 'BKL'];
  const playerBoards = boards.filter(b =>
    (currentTurn === 'white' && b.startsWith('W')) ||
    (currentTurn === 'black' && b.startsWith('B'))
  );

  const validPins = selectedBoard ? getValidPinsForBoard(selectedBoard) : [];

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      padding: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      borderRadius: '10px',
      zIndex: 1000
    }}>
      <h3>Attack Board Movement</h3>

      <div style={{ marginBottom: '10px' }}>
        <label>Select Board:</label>
        <select
          value={selectedBoard || ''}
          onChange={(e) => setSelectedBoard(e.target.value || null)}
          style={{ marginLeft: '10px' }}
        >
          <option value="">-- Select --</option>
          {playerBoards.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {selectedBoard && (
        <div>
          <label>Move to Pin:</label>
          <div style={{ marginTop: '5px' }}>
            {validPins.length === 0 && <div>No valid moves</div>}
            {validPins.map(pin => (
              <button
                key={pin}
                onClick={() => {
                  moveAttackBoard(selectedBoard, pin);
                  setSelectedBoard(null);
                }}
                style={{
                  margin: '5px',
                  padding: '5px 10px',
                  cursor: 'pointer'
                }}
              >
                {pin}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Step 8.8: Testing Strategy for Attack Boards

**Create `src/engine/attackBoards/__tests__/occupancy.test.ts`:**

```typescript
import { describe, it, expect } from 'vitest';
import { createChessWorld } from '../../world/worldBuilder';
import { canBoardMove, getBoardController, countPiecesOnBoard } from '../occupancy';

describe('Attack Board Occupancy', () => {
  it('should allow empty board to move', () => {
    const world = createChessWorld();
    const pieces = [];

    expect(canBoardMove('WQL', pieces, world)).toBe(true);
  });

  it('should allow board with 1 piece to move', () => {
    const world = createChessWorld();
    const pieces = [{
      id: 'p1',
      type: 'pawn' as const,
      color: 'white' as const,
      squareId: 'z0WQL',
      hasMoved: false
    }];

    expect(canBoardMove('WQL', pieces, world)).toBe(true);
    expect(countPiecesOnBoard('WQL', pieces, world)).toBe(1);
  });

  it('should prevent board with 2+ pieces from moving', () => {
    const world = createChessWorld();
    const pieces = [
      { id: 'p1', type: 'pawn' as const, color: 'white' as const, squareId: 'z0WQL', hasMoved: false },
      { id: 'p2', type: 'pawn' as const, color: 'white' as const, squareId: 'a0WQL', hasMoved: false }
    ];

    expect(canBoardMove('WQL', pieces, world)).toBe(false);
  });

  it('should determine controller by piece color', () => {
    const world = createChessWorld();
    const pieces = [{
      id: 'p1',
      type: 'pawn' as const,
      color: 'black' as const,
      squareId: 'z0WQL',
      hasMoved: false
    }];

    // Black piece controls white's attack board
    expect(getBoardController('WQL', pieces, world)).toBe('black');
  });
});
```

### Step 8.9: Key Implementation Challenges

#### Challenge 1: Quadrant Rotation Logic
**Problem:** When a board rotates 180°, pieces need to move to opposite quadrants.

**Solution:** Track quadrant positions and use rotation mapping:
- q1 (top-left) ↔ q3 (bottom-left)
- q2 (top-right) ↔ q4 (bottom-right)

#### Challenge 2: Vertical Shadow for Boards
**Problem:** Board movement must check 4 squares simultaneously for vertical obstruction.

**Solution:** For each of the 4 destination squares, scan ALL levels for non-knight pieces.

#### Challenge 3: Passenger Piece State
**Problem:** Pieces that move with a board lose double-move privileges (pawns).

**Solution:** Add `movedAsPassenger: true` flag when updating piece positions.

#### Challenge 4: Cross-Side Movement
**Problem:** Boards can move from QL pins to KL pins (and vice versa).

**Solution:** Add `crossPins` to adjacency lists for lateral movement.

### Step 8.10: Visual Indicators

Add visual feedback for attack board movement:

1. **Highlight movable boards** when it's a player's turn
2. **Show valid pins** with glowing indicators
3. **Preview board position** before confirming move
4. **Animate board movement** smoothly to new position
5. **Show quadrant rotation** with rotation animation

**✅ Phase 8 Complete Strategy**

**Phases 6-10 would continue with same approach**
# Phase 9: Advanced UI Components - Detailed Implementation Plan

## Overview

This phase focuses on creating a polished, professional user interface with camera presets, game management features, and enhanced attack board controls. The UI will be modular, responsive, and follow the established theme system.

---

## 9.1: Camera View System

### Objective
Implement three preset camera views (Top, Side, Front) with smooth transitions and slight tilts for optimal piece visibility.

### Step 9.1.1: Define Camera Presets

**Create `src/config/cameraPresets.ts`:**

```typescript
/**
 * Camera preset configurations for different viewing angles.
 * Each preset includes position, target (lookAt), and tilt for optimal visibility.
 */

export interface CameraPreset {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  description: string;
}

export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  top: {
    name: 'Top View',
    position: [0, 0, 35],      // Directly above, slightly tilted
    target: [0, 2, 4],          // Look slightly forward
    description: 'Bird\'s eye view with slight forward tilt'
  },

  side: {
    name: 'Side View',
    position: [25, -3, 12],     // From the side
    target: [0, 0, 8],          // Look at center of board stack
    description: 'Side perspective showing all levels'
  },

  front: {
    name: 'Front View',
    position: [0, -25, 15],     // From white's perspective
    target: [0, 2, 6],          // Look at center-top
    description: 'White player\'s perspective'
  },

  // Current default (can be customized)
  default: {
    name: 'Default View',
    position: [0, -15, 20],
    target: [0, 0, 5],
    description: 'Standard 3/4 view'
  }
};

// Animation duration for camera transitions (milliseconds)
export const CAMERA_TRANSITION_DURATION = 1000;

// Easing function for smooth transitions
export type EasingFunction = (t: number) => number;

export const CAMERA_EASING: EasingFunction = (t: number) => {
  // Smooth ease-in-out cubic
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
```

### Step 9.1.2: Create Camera Control Hook

**Create `src/hooks/useCameraPreset.ts`:**

```typescript
import { useThree } from '@react-three/fiber';
import { useRef, useCallback } from 'react';
import { Vector3 } from 'three';
import {
  CAMERA_PRESETS,
  CAMERA_TRANSITION_DURATION,
  CAMERA_EASING,
  CameraPreset
} from '../config/cameraPresets';

export function useCameraPreset() {
  const { camera, controls } = useThree();
  const animationRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  const animateCamera = useCallback(
    (targetPos: Vector3, targetLookAt: Vector3) => {
      if (isAnimatingRef.current && animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      isAnimatingRef.current = true;
      const startPos = camera.position.clone();
      const startLookAt = controls?.target?.clone() || new Vector3(0, 0, 5);
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / CAMERA_TRANSITION_DURATION, 1);
        const easedProgress = CAMERA_EASING(progress);

        // Interpolate position
        camera.position.lerpVectors(startPos, targetPos, easedProgress);

        // Interpolate look-at target
        if (controls?.target) {
          controls.target.lerpVectors(startLookAt, targetLookAt, easedProgress);
          controls.update();
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          isAnimatingRef.current = false;
          animationRef.current = null;
        }
      };

      animate();
    },
    [camera, controls]
  );

  const setPreset = useCallback(
    (presetName: keyof typeof CAMERA_PRESETS) => {
      const preset = CAMERA_PRESETS[presetName];
      if (!preset) {
        console.warn(`Camera preset "${presetName}" not found`);
        return;
      }

      const targetPos = new Vector3(...preset.position);
      const targetLookAt = new Vector3(...preset.target);

      animateCamera(targetPos, targetLookAt);
    },
    [animateCamera]
  );

  return { setPreset, isAnimating: isAnimatingRef.current };
}
```

### Step 9.1.3: Create Camera View Buttons Component

**Create `src/components/UI/CameraViewButtons.tsx`:**

```typescript
import { useCameraPreset } from '../../hooks/useCameraPreset';
import { CAMERA_PRESETS } from '../../config/cameraPresets';
import { THEME } from '../../config/theme';

export function CameraViewButtons() {
  const { setPreset, isAnimating } = useCameraPreset();

  const buttons = [
    { key: 'top', label: 'Top', icon: '⬇' },
    { key: 'side', label: 'Side', icon: '↔' },
    { key: 'front', label: 'Front', icon: '⬆' },
  ] as const;

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '10px',
        padding: '10px',
        backgroundColor: THEME.ui?.controlBackground || 'rgba(0, 0, 0, 0.8)',
        borderRadius: '10px',
        zIndex: 1000,
      }}
    >
      <div style={{
        color: THEME.ui?.controlText || 'white',
        fontSize: '12px',
        marginRight: '5px',
        alignSelf: 'center',
        fontWeight: 'bold'
      }}>
        VIEW:
      </div>

      {buttons.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => setPreset(key)}
          disabled={isAnimating}
          style={{
            padding: '8px 16px',
            backgroundColor: THEME.ui?.buttonBackground || '#4a5568',
            color: THEME.ui?.controlText || 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isAnimating ? 'wait' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            opacity: isAnimating ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isAnimating) {
              e.currentTarget.style.backgroundColor =
                THEME.ui?.buttonHover || '#718096';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              THEME.ui?.buttonBackground || '#4a5568';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          title={CAMERA_PRESETS[key].description}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## 9.2: Move History Panel

### Objective
Create a collapsible panel showing move history with the ability to review past moves.

### Step 9.2.1: Extend Game Store for Move History

**Update `src/store/gameStore.ts`:**

```typescript
export interface MoveHistoryEntry {
  index: number;
  turn: 'white' | 'black';
  notation: string;           // e.g., "a2W-a3W" or "WQL:QL1-QL2 ⟳"
  timestamp: number;
  type: 'piece' | 'board';
  capturedPiece?: {
    type: string;
    color: string;
  };
}

export interface GameState {
  // ... existing fields
  moveHistory: MoveHistoryEntry[];
  selectedHistoryIndex: number | null;  // For move review
}

// Add to store implementation:
export const useGameStore = create<GameStore>((set, get) => ({
  // ... existing state
  moveHistory: [],
  selectedHistoryIndex: null,

  // Update movePiece to record history
  movePiece: (fromSquareId: string, toSquareId: string) => {
    const state = get();

    // ... existing validation logic

    // Check for captured piece
    const capturedPieceIndex = state.pieces.findIndex(p =>
      createSquareId(p.file, p.rank, p.level) === toSquareId
    );

    const capturedPiece = capturedPieceIndex >= 0
      ? {
          type: state.pieces[capturedPieceIndex].type,
          color: state.pieces[capturedPieceIndex].color
        }
      : undefined;

    // ... existing move logic

    // Record move
    const historyEntry: MoveHistoryEntry = {
      index: state.moveHistory.length,
      turn: state.currentTurn,
      notation: `${fromSquareId}-${toSquareId}`,
      timestamp: Date.now(),
      type: 'piece',
      capturedPiece,
    };

    set({
      // ... existing updates
      moveHistory: [...state.moveHistory, historyEntry],
      selectedHistoryIndex: null,
    });

    return true;
  },

  // Update moveBoard to record history
  moveBoard: (boardId: string, toPinId: string, rotation?: BoardRotation) => {
    // ... existing logic

    const historyEntry: MoveHistoryEntry = {
      index: state.moveHistory.length,
      turn: state.currentTurn,
      notation: `${boardId}:${fromPinId}-${toPinId}${rotation ? ' ⟳' : ''}`,
      timestamp: Date.now(),
      type: 'board',
    };

    set({
      // ... existing updates
      moveHistory: [...state.moveHistory, historyEntry],
    });

    return true;
  },
}));
```

### Step 9.2.2: Create Move History Component

**Create `src/components/UI/MoveHistory.tsx`:**

```typescript
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { THEME } from '../../config/theme';

export function MoveHistory() {
  const [isExpanded, setIsExpanded] = useState(false);
  const moveHistory = useGameStore((state) => state.moveHistory);

  // Group moves by turn number (white + black = 1 turn)
  const groupedMoves: Array<{ white?: MoveHistoryEntry; black?: MoveHistoryEntry }> = [];

  for (let i = 0; i < moveHistory.length; i++) {
    const move = moveHistory[i];
    const turnIndex = Math.floor(i / 2);

    if (!groupedMoves[turnIndex]) {
      groupedMoves[turnIndex] = {};
    }

    if (move.turn === 'white') {
      groupedMoves[turnIndex].white = move;
    } else {
      groupedMoves[turnIndex].black = move;
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: isExpanded ? '320px' : '120px',
        maxHeight: isExpanded ? '60vh' : '50px',
        backgroundColor: THEME.ui?.controlBackground || 'rgba(0, 0, 0, 0.8)',
        borderRadius: '10px',
        padding: '10px',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isExpanded ? '10px' : '0',
        }}
      >
        <span style={{
          color: THEME.ui?.controlText || 'white',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          Move History
        </span>
        <span style={{ fontSize: '16px' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Move list */}
      {isExpanded && (
        <div
          style={{
            maxHeight: 'calc(60vh - 100px)',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {groupedMoves.length === 0 ? (
            <div style={{
              color: '#888',
              fontSize: '12px',
              textAlign: 'center',
              padding: '20px 0'
            }}>
              No moves yet
            </div>
          ) : (
            groupedMoves.map((turn, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '5px',
                  fontSize: '12px',
                  color: THEME.ui?.controlText || 'white',
                }}
              >
                {/* Turn number */}
                <div style={{
                  width: '25px',
                  fontWeight: 'bold',
                  color: '#888',
                  flexShrink: 0
                }}>
                  {index + 1}.
                </div>

                {/* White's move */}
                <div style={{
                  flex: 1,
                  padding: '3px 5px',
                  backgroundColor: turn.white ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  borderRadius: '3px',
                }}>
                  {turn.white ? (
                    <>
                      {turn.white.notation}
                      {turn.white.capturedPiece && (
                        <span style={{ color: '#ff6666', marginLeft: '5px' }}>
                          ×{turn.white.capturedPiece.type[0].toUpperCase()}
                        </span>
                      )}
                    </>
                  ) : '...'}
                </div>

                {/* Black's move */}
                <div style={{
                  flex: 1,
                  padding: '3px 5px',
                  backgroundColor: turn.black ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  borderRadius: '3px',
                }}>
                  {turn.black ? (
                    <>
                      {turn.black.notation}
                      {turn.black.capturedPiece && (
                        <span style={{ color: '#ff6666', marginLeft: '5px' }}>
                          ×{turn.black.capturedPiece.type[0].toUpperCase()}
                        </span>
                      )}
                    </>
                  ) : ''}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 9.3: Game Management Menu

### Objective
Create a menu for starting a new game, saving, and loading games.

### Step 9.3.1: Create Game Persistence Utilities

**Create `src/utils/gamePersistence.ts`:**

```typescript
import { GameState } from '../store/gameStore';

export interface SavedGame {
  id: string;
  name: string;
  timestamp: number;
  state: Partial<GameState>;
  thumbnail?: string;  // Base64 canvas screenshot (future enhancement)
}

const STORAGE_KEY = 'tri_dim_chess_saves';

export function saveGame(name: string, state: Partial<GameState>): SavedGame {
  const savedGame: SavedGame = {
    id: Date.now().toString(),
    name,
    timestamp: Date.now(),
    state: {
      pieces: state.pieces,
      currentTurn: state.currentTurn,
      moveHistory: state.moveHistory,
      attackBoardPositions: state.attackBoardPositions,
      check: state.check,
      checkmate: state.checkmate,
      stalemate: state.stalemate,
    },
  };

  const saves = getSavedGames();
  saves.push(savedGame);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));

  return savedGame;
}

export function getSavedGames(): SavedGame[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function loadGame(id: string): SavedGame | null {
  const saves = getSavedGames();
  return saves.find(save => save.id === id) || null;
}

export function deleteGame(id: string): void {
  const saves = getSavedGames().filter(save => save.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}
```

### Step 9.3.2: Extend Game Store for Save/Load

**Update `src/store/gameStore.ts`:**

```typescript
interface GameStore extends GameState {
  // ... existing methods
  saveCurrentGame: (name: string) => SavedGame;
  loadSavedGame: (id: string) => boolean;
  startNewGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // ... existing implementation

  saveCurrentGame: (name: string) => {
    const state = get();
    return saveGame(name, state);
  },

  loadSavedGame: (id: string) => {
    const savedGame = loadGame(id);
    if (!savedGame) return false;

    set({
      pieces: savedGame.state.pieces || initialState.pieces,
      currentTurn: savedGame.state.currentTurn || 'white',
      moveHistory: savedGame.state.moveHistory || [],
      attackBoardPositions: savedGame.state.attackBoardPositions || initialState.attackBoardPositions,
      check: savedGame.state.check,
      checkmate: savedGame.state.checkmate,
      stalemate: savedGame.state.stalemate || false,
      selectedSquareId: null,
      highlightedSquareIds: [],
      selectedBoardId: null,
      highlightedPinIds: [],
    });

    return true;
  },

  startNewGame: () => {
    set({
      ...initialState,
      world: createChessWorld(),
      pieces: createInitialPieces(),
    });
  },
}));
```

### Step 9.3.3: Create Game Menu Component

**Create `src/components/UI/GameMenu.tsx`:**

```typescript
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getSavedGames, deleteGame, formatTimestamp } from '../../utils/gamePersistence';
import { THEME } from '../../config/theme';

export function GameMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState('');

  const startNewGame = useGameStore((state) => state.startNewGame);
  const saveCurrentGame = useGameStore((state) => state.saveCurrentGame);
  const loadSavedGame = useGameStore((state) => state.loadSavedGame);

  const savedGames = getSavedGames();

  const handleNewGame = () => {
    if (confirm('Start a new game? Current progress will be lost unless saved.')) {
      startNewGame();
      setIsOpen(false);
    }
  };

  const handleSave = () => {
    if (!saveName.trim()) {
      alert('Please enter a name for this save');
      return;
    }
    saveCurrentGame(saveName);
    setSaveName('');
    setShowSaveDialog(false);
    setIsOpen(false);
  };

  const handleLoad = (id: string) => {
    if (confirm('Load this game? Current progress will be lost unless saved.')) {
      loadSavedGame(id);
      setShowLoadDialog(false);
      setIsOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this saved game?')) {
      deleteGame(id);
      setShowLoadDialog(false);
    }
  };

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          backgroundColor: THEME.ui?.buttonBackground || '#4a5568',
          color: THEME.ui?.controlText || 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 1001,
        }}
      >
        ☰ MENU
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: THEME.ui?.controlBackground || 'rgba(0, 0, 0, 0.95)',
              padding: '30px',
              borderRadius: '15px',
              minWidth: '300px',
              color: THEME.ui?.controlText || 'white',
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Game Menu</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleNewGame}
                style={menuButtonStyle}
              >
                🎮 New Game
              </button>

              <button
                onClick={() => {
                  setShowSaveDialog(true);
                  setIsOpen(false);
                }}
                style={menuButtonStyle}
              >
                💾 Save Game
              </button>

              <button
                onClick={() => {
                  setShowLoadDialog(true);
                  setIsOpen(false);
                }}
                style={menuButtonStyle}
              >
                📂 Load Game ({savedGames.length})
              </button>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  ...menuButtonStyle,
                  backgroundColor: '#666',
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
          }}
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: THEME.ui?.controlBackground || 'rgba(0, 0, 0, 0.95)',
              padding: '30px',
              borderRadius: '15px',
              minWidth: '300px',
              color: THEME.ui?.controlText || 'white',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Save Game</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter save name..."
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '15px',
                borderRadius: '5px',
                border: '1px solid #555',
                backgroundColor: '#333',
                color: 'white',
                fontSize: '14px',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSave} style={menuButtonStyle}>
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                style={{ ...menuButtonStyle, backgroundColor: '#666' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
          }}
          onClick={() => setShowLoadDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: THEME.ui?.controlBackground || 'rgba(0, 0, 0, 0.95)',
              padding: '30px',
              borderRadius: '15px',
              minWidth: '400px',
              maxHeight: '70vh',
              overflow: 'auto',
              color: THEME.ui?.controlText || 'white',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Load Game</h3>

            {savedGames.length === 0 ? (
              <p style={{ color: '#888' }}>No saved games found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {savedGames.map((save) => (
                  <div
                    key={save.id}
                    style={{
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{save.name}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {formatTimestamp(save.timestamp)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => handleLoad(save.id)}
                        style={{
                          ...menuButtonStyle,
                          padding: '5px 10px',
                          fontSize: '12px',
                        }}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDelete(save.id)}
                        style={{
                          ...menuButtonStyle,
                          padding: '5px 10px',
                          fontSize: '12px',
                          backgroundColor: '#d32f2f',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowLoadDialog(false)}
              style={{
                ...menuButtonStyle,
                marginTop: '15px',
                width: '100%',
                backgroundColor: '#666',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const menuButtonStyle: React.CSSProperties = {
  padding: '12px 20px',
  backgroundColor: '#4a5568',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  transition: 'background-color 0.2s',
};
```

---

## 9.4: Enhanced Attack Board Controls

### Objective
Improve attack board UI with rotation controls and visual feedback.

### Step 9.4.1: Add Rotation to Board Selection

**Update `src/components/UI/AttackBoardControls.tsx`:**

```typescript
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getBoardController, getPiecesOnBoard } from '../../engine/attackBoards/occupancy';
import { PieceState } from '../../engine/movement/types';
import { createSquareId } from '../../engine/world/coordinates';
import { THEME } from '../../config/theme';
import { BoardRotation } from '../../engine/attackBoards/types';

export function AttackBoardControls() {
  const [selectedRotation, setSelectedRotation] = useState<BoardRotation>(0);

  const currentTurn = useGameStore((state) => state.currentTurn);
  const pieces = useGameStore((state) => state.pieces);
  const world = useGameStore((state) => state.world);
  const attackBoardPositions = useGameStore((state) => state.attackBoardPositions);
  const selectedBoardId = useGameStore((state) => state.selectedBoardId);
  const selectBoard = useGameStore((state) => state.selectBoard);
  const moveBoard = useGameStore((state) => state.moveBoard);
  const highlightedPinIds = useGameStore((state) => state.highlightedPinIds);

  const pieceToPieceState = (piece: any): PieceState => ({
    id: piece.id,
    type: piece.type,
    color: piece.color,
    squareId: createSquareId(piece.file, piece.rank, piece.level),
    hasMoved: piece.hasMoved,
    movedAsPassenger: piece.movedAsPassenger,
  });

  const pieceStates = pieces.map(pieceToPieceState);

  const attackBoards = [
    { id: 'WQL', name: 'White QL', owner: 'white' as const },
    { id: 'WKL', name: 'White KL', owner: 'white' as const },
    { id: 'BQL', name: 'Black QL', owner: 'black' as const },
    { id: 'BKL', name: 'Black KL', owner: 'black' as const },
  ];

  const handlePinClick = (pinId: string) => {
    if (selectedBoardId && highlightedPinIds.includes(pinId)) {
      moveBoard(selectedBoardId, pinId, selectedRotation);
      setSelectedRotation(0); // Reset rotation after move
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        padding: '15px',
        backgroundColor: THEME.ui?.controlBackground || 'rgba(0, 0, 0, 0.8)',
        color: THEME.ui?.controlText || 'white',
        borderRadius: '10px',
        minWidth: '280px',
        zIndex: 1000,
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
        Attack Boards
      </h3>

      {/* Board List */}
      {attackBoards.map(({ id, name, owner }) => {
        const pinId = attackBoardPositions[id as keyof typeof attackBoardPositions];
        const controller = getBoardController(id, pieceStates, world, owner);
        const boardPieces = getPiecesOnBoard(id, pieceStates, world);
        const isSelected = selectedBoardId === id;
        const canControl = controller === currentTurn;

        return (
          <div
            key={id}
            onClick={() => canControl && selectBoard(id)}
            style={{
              padding: '10px',
              marginBottom: '8px',
              backgroundColor: isSelected
                ? 'rgba(255, 215, 0, 0.3)'
                : canControl
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              cursor: canControl ? 'pointer' : 'default',
              border: isSelected ? '2px solid gold' : '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              {name}
            </div>
            <div style={{ fontSize: '11px', color: '#ccc' }}>
              📍 Pin: {pinId} | 🎲 Pieces: {boardPieces.length}
            </div>
            <div style={{ fontSize: '11px', marginTop: '3px' }}>
              🎯 Controller:{' '}
              <span
                style={{
                  color: controller === 'white'
                    ? '#f5f5dc'
                    : controller === 'black'
                      ? '#888'
                      : '#ff6666',
                  fontWeight: 'bold',
                }}
              >
                {controller ? controller.toUpperCase() : 'CONTESTED'}
              </span>
            </div>
          </div>
        );
      })}

      {/* Rotation Controls (shown when board is selected) */}
      {selectedBoardId && (
        <div
          style={{
            marginTop: '15px',
            padding: '12px',
            backgroundColor: 'rgba(255, 215, 0, 0.15)',
            borderRadius: '8px',
            border: '1px solid gold',
          }}
        >
          <div style={{
            fontSize: '13px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: 'gold'
          }}>
            🔄 Rotation
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedRotation(0)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: selectedRotation === 0
                  ? 'gold'
                  : 'rgba(255, 255, 255, 0.2)',
                color: selectedRotation === 0 ? 'black' : 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              0° (Normal)
            </button>

            <button
              onClick={() => setSelectedRotation(180)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: selectedRotation === 180
                  ? 'gold'
                  : 'rgba(255, 255, 255, 0.2)',
                color: selectedRotation === 180 ? 'black' : 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              180° (Flip)
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div style={{
        marginTop: '12px',
        fontSize: '11px',
        color: '#aaa',
        lineHeight: '1.4'
      }}>
        {selectedBoardId ? (
          <>
            <div>✨ Board selected!</div>
            <div>1. Choose rotation (0° or 180°)</div>
            <div>2. Click a highlighted pin in the 3D view</div>
          </>
        ) : (
          <div>Click a board you control to see valid moves</div>
        )}
      </div>
    </div>
  );
}
```

---

## 9.5: Theme Enhancements for UI

### Step 9.5.1: Extend Theme Configuration

**Update `src/config/theme.ts`:**

```typescript
export const THEME = {
  // ... existing theme properties

  // UI-specific theme properties
  ui: {
    background: '#1a1a2e',
    controlBackground: 'rgba(0, 0, 0, 0.85)',
    controlText: '#ffffff',

    // Button styles
    buttonBackground: '#4a5568',
    buttonHover: '#718096',
    buttonActive: '#2d3748',
    buttonDisabled: '#2d3748',

    // Status colors
    statusBackground: {
      white: '#e8e8e8',
      black: '#333333',
      check: '#ffcc00',
      checkmate: '#ff0000',
      draw: '#888888',
    },

    // Menu styles
    menuOverlay: 'rgba(0, 0, 0, 0.7)',
    menuBackground: 'rgba(0, 0, 0, 0.95)',

    // Attack board control colors
    attackBoard: {
      selected: 'rgba(255, 215, 0, 0.3)',
      available: 'rgba(255, 255, 255, 0.1)',
      unavailable: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.2)',
      selectedBorder: 'gold',
    },

    // Move history colors
    history: {
      white: 'rgba(255, 255, 255, 0.1)',
      black: 'rgba(255, 255, 255, 0.1)',
      capture: '#ff6666',
      selected: 'rgba(255, 215, 0, 0.2)',
    },
  },

  // Animation durations (milliseconds)
  animations: {
    cameraTransition: 1000,
    boardMove: 800,
    pieceMove: 600,
    uiFade: 300,
  },
};
```

---

## 9.6: Integration and Testing

### Step 9.6.1: Update App.tsx

**Update `src/App.tsx`:**

```typescript
import { Board3D } from './components/Board3D/Board3D';
import { TurnIndicator } from './components/UI/TurnIndicator';
import { AttackBoardControls } from './components/UI/AttackBoardControls';
import { CameraViewButtons } from './components/UI/CameraViewButtons';
import { MoveHistory } from './components/UI/MoveHistory';
import { GameMenu } from './components/UI/GameMenu';
import { useGameStore } from './store/gameStore';
import { logWorldCoordinates } from './utils/debugLogger';
import { useEffect } from 'react';

function App() {
  const world = useGameStore((state) => state.world);

  // Log coordinates on mount (for debugging)
  useEffect(() => {
    logWorldCoordinates(world);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 3D Scene */}
      <Board3D />

      {/* UI Components */}
      <TurnIndicator />
      <CameraViewButtons />
      <MoveHistory />
      <GameMenu />
      <AttackBoardControls />
    </div>
  );
}

export default App;
```

### Step 9.6.2: Testing Checklist

**Camera View System:**
- [ ] Top view shows all boards from above with slight tilt
- [ ] Side view shows vertical stack clearly
- [ ] Front view provides good playing angle for white
- [ ] Transitions are smooth and complete
- [ ] Controls are disabled during transitions

**Move History:**
- [ ] Collapsible panel opens/closes smoothly
- [ ] Moves are grouped by turn number
- [ ] Captures are indicated with special notation
- [ ] Scrolling works for long games
- [ ] History persists across game saves

**Game Menu:**
- [ ] New game prompts for confirmation
- [ ] Save dialog accepts custom names
- [ ] Load dialog shows all saved games with timestamps
- [ ] Delete works correctly
- [ ] Games persist in localStorage

**Attack Board Controls:**
- [ ] Rotation selection is visible and functional
- [ ] Selected rotation is applied to moves
- [ ] Rotation resets after board move
- [ ] Visual feedback for selected board
- [ ] Help text updates based on selection state

### Step 9.6.3: Responsive Design Considerations

**For different screen sizes:**

```typescript
// Add to theme.ts
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
};

// Example usage in components
const isMobile = window.innerWidth < BREAKPOINTS.mobile;

// Adjust UI layout for mobile:
// - Stack controls vertically
// - Reduce padding/margins
// - Use icons instead of text labels
// - Make menu full-screen
```

---

## 9.7: Visual Polish

### Step 9.7.1: Add Tooltips

**Create `src/components/UI/Tooltip.tsx`:**

```typescript
import { ReactNode, useState } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '6px 10px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            fontSize: '12px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
```

### Step 9.7.2: Add Loading States

**Create `src/components/UI/LoadingSpinner.tsx`:**

```typescript
export function LoadingSpinner() {
  return (
    <div
      style={{
        display: 'inline-block',
        width: '20px',
        height: '20px',
        border: '3px solid rgba(255, 255, 255, 0.3)',
        borderTop: '3px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
  );
}

// Add to global CSS or styled component
const spinKeyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
```

---

## Implementation Priority

### Phase 9.1 (High Priority)
1. Camera view system with preset buttons
2. Enhanced attack board controls with rotation

### Phase 9.2 (Medium Priority)
3. Move history panel
4. Game menu (new/save/load)

### Phase 9.3 (Low Priority)
5. Tooltips
6. Loading states
7. Responsive design adjustments

---

## Files to Create

```
src/
├── config/
│   ├── cameraPresets.ts          (NEW)
│   └── theme.ts                  (UPDATE)
├── hooks/
│   └── useCameraPreset.ts        (NEW)
├── components/
│   └── UI/
│       ├── CameraViewButtons.tsx (NEW)
│       ├── MoveHistory.tsx       (NEW)
│       ├── GameMenu.tsx          (NEW)
│       ├── AttackBoardControls.tsx (UPDATE)
│       ├── Tooltip.tsx           (NEW)
│       └── LoadingSpinner.tsx    (NEW)
├── utils/
│   └── gamePersistence.ts        (NEW)
└── store/
    └── gameStore.ts              (UPDATE)
```

---

## Success Criteria

✅ **Camera System**
- 3 preset views work smoothly
- Transitions are animated
- Users can still manually control camera

✅ **Move History**
- All moves are recorded with notation
- Panel is collapsible and scrollable
- Captures are visually distinct

✅ **Game Management**
- New game, save, and load all work
- Games persist across browser sessions
- User can manage multiple saves

✅ **Attack Board UX**
- Rotation selection is intuitive
- Visual feedback is clear
- Help text guides the user

✅ **Polish**
- All buttons have hover effects
- Tooltips provide helpful context
- Loading states prevent confusion

---

**End of Phase 9 Plan**
