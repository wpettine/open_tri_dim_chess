# 3D Chess Implementation Plan

## Project Overview
This repository contains documentation and assets for a 3D chess game (Raumschach/Tri-Dimensional Chess) but lacks the actual implementation. Based on the design document, this should be a React/TypeScript web application using Three.js for 3D rendering.

## Current Repository State
- **Documentation**: Comprehensive design document and reference materials
- **Assets**: 3D chess piece models in `/public/models/chess/`
- **Implementation**: Missing - no source code, package.json, or build configuration
- **Project Type**: Should be React + TypeScript + Three.js + Vite

## Implementation Steps Required

### Phase 1: Project Initialization
1. **Initialize Vite React TypeScript Project**
   - Run `npm create vite@latest . -- --template react-ts`
   - This will create package.json, tsconfig.json, vite.config.ts, and basic React structure

2. **Install Core Dependencies**
   ```bash
   npm install three @react-three/fiber @react-three/drei zustand
   npm install -D vitest @testing-library/react @types/three
   ```

3. **Verify Project Structure**
   - Ensure existing `/public` and `/reference_docs` are preserved
   - Check that 3D models in `/public/models/chess/` are accessible

### Phase 2: Development Environment Setup
1. **Configure TypeScript**
   - Ensure strict mode is enabled
   - Add path aliases for clean imports
   - Configure for Three.js types

2. **Set up Testing Framework**
   - Configure Vitest for unit tests
   - Set up React Testing Library
   - Create test utilities for 3D components

3. **Development Tools**
   - ESLint configuration for React/TypeScript
   - Prettier for code formatting
   - Husky for git hooks (optional)

### Phase 3: Core Architecture Implementation
Based on the design document's "World Grid System" approach:

1. **World Grid Foundation** (`src/engine/world/`)
   - `types.ts` - Define WorldSquare, BoardLayout, ChessWorld interfaces
   - `pinPositions.ts` - Define all 24 pin positions for attack boards
   - `worldBuilder.ts` - Create and initialize the 3D chess world
   - `worldMutation.ts` - Handle attack board movement

2. **Game Engine** (`src/engine/`)
   - `types.ts` - Piece, GameState, Move interfaces
   - `initialSetup.ts` - Starting piece positions
   - `gameEngine.ts` - Core game logic and move execution

3. **Movement Rules** (`src/engine/rules/`)
   - `directionHelpers.ts` - 3D movement direction vectors
   - `moveValidation.ts` - Piece-specific movement validation
   - `checkDetection.ts` - Check/checkmate detection

### Phase 4: 3D Rendering Components
1. **Scene Setup** (`src/components/Board3D/`)
   - `Board3D.tsx` - Main 3D scene with camera and lighting
   - `CameraController.tsx` - Orbit controls and camera management

2. **Board Rendering**
   - `BoardRenderer.tsx` - Render all 7 boards (3 main + 4 attack)
   - Handle board positioning and rotation
   - Render squares at absolute world coordinates

3. **Piece Rendering**
   - `ChessPieceModel.tsx` - Load GLTF models from `/public/models/chess/`
   - `Pieces3D.tsx` - Render all pieces at world coordinates
   - Handle piece selection and hover effects

4. **Game Interaction**
   - `ValidMoveIndicators.tsx` - Show valid moves
   - `PinIndicators.tsx` - Show attack board pin positions
   - Click handlers for piece selection and movement

### Phase 5: State Management
1. **Zustand Store** (`src/store/gameStore.ts`)
   - Game state management
   - Actions for piece movement, board movement
   - Selectors for UI components

2. **Game Actions**
   - Piece selection and movement
   - Attack board movement
   - Turn management
   - Move history

### Phase 6: UI Components
1. **Game Controls** (`src/components/UI/`)
   - `GameControls.tsx` - New game, undo, settings
   - `GameStatus.tsx` - Current turn, check status
   - `MoveHistory.tsx` - Move notation and history

2. **Main App Structure**
   - `Game.tsx` - Main game component
   - `App.tsx` - Application root
   - Layout and responsive design

### Phase 7: Testing Strategy
1. **Unit Tests**
   - World grid coordinate validation
   - Movement rule validation for each piece type
   - Game state transitions
   - Attack board movement logic

2. **Integration Tests**
   - Complete game scenarios
   - 3D rendering validation
   - User interaction flows

3. **Visual Validation**
   - Debug visualizers for coordinate alignment
   - Piece-square alignment verification
   - Attack board positioning validation

## Critical Implementation Considerations

### 1. Coordinate System Validation
The design document emphasizes that the original implementation had alignment bugs. Key requirements:
- **Single Source of Truth**: World grid stores all positions
- **Consistent Formulas**: Same coordinate functions for squares and pieces
- **Visual Validation**: Debug tools to verify alignment
- **No Hardcoding**: Derive coordinates from requirements, not examples

### 2. 3D Chess Rules Implementation
- 7 boards total (3 main levels + 4 movable attack boards)
- Complex piece movement in 3D space
- Attack board movement rules and restrictions
- Pin system for attack board positioning

### 3. Performance Considerations
- Efficient 3D rendering with Three.js
- Optimized piece model loading
- Smooth animations for piece and board movement
- Responsive camera controls

### 4. Development Workflow
1. **Validation First**: Implement coordinate system and validate visually
2. **Incremental Development**: Build and test each component separately
3. **Comprehensive Testing**: Unit tests for all game logic
4. **Visual Debugging**: Tools to inspect 3D positioning

## Dependencies to Install

### Core Dependencies
- `react` + `react-dom` (from Vite template)
- `typescript` (from Vite template)
- `three` - 3D graphics library
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for React Three Fiber
- `zustand` - State management

### Development Dependencies
- `vite` (from template)
- `vitest` - Testing framework
- `@testing-library/react` - React testing utilities
- `@types/three` - TypeScript definitions for Three.js
- `eslint` + `@typescript-eslint/*` - Linting
- `prettier` - Code formatting

### Optional Dependencies
- `react-spring` or `framer-motion` - Animations
- `@react-three/postprocessing` - Visual effects
- `leva` - Debug GUI for development

## File Structure to Create
```
src/
├── engine/
│   ├── world/
│   │   ├── types.ts
│   │   ├── worldBuilder.ts
│   │   ├── worldMutation.ts
│   │   ├── pinPositions.ts
│   │   └── __tests__/
│   ├── rules/
│   │   ├── moveValidation.ts
│   │   ├── checkDetection.ts
│   │   ├── directionHelpers.ts
│   │   └── __tests__/
│   ├── gameEngine.ts
│   ├── initialSetup.ts
│   ├── types.ts
│   └── constants.ts
├── components/
│   ├── Board3D/
│   │   ├── Board3D.tsx
│   │   ├── BoardRenderer.tsx
│   │   ├── Pieces3D.tsx
│   │   ├── ChessPieceModel.tsx
│   │   ├── ValidMoveIndicators.tsx
│   │   ├── CameraController.tsx
│   │   └── PinIndicators.tsx
│   ├── UI/
│   │   ├── GameControls.tsx
│   │   ├── GameStatus.tsx
│   │   └── MoveHistory.tsx
│   └── Game/
│       └── Game.tsx
├── store/
│   └── gameStore.ts
├── config/
│   └── theme.ts
├── utils/
│   └── notation.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Setup Steps for Devin

### Step 3: Install Dependencies
Since there's no package.json yet, we need to:
1. Initialize Vite React TypeScript project
2. Install Three.js and related packages
3. Install testing dependencies
4. Verify the setup works

### Step 4: Maintain Dependencies
Command: `cd ~/repos/open_tri_dim_chess && npm install`

### Step 5: Setup Lint
Look for ESLint configuration (will be created with Vite template)
Command: `cd ~/repos/open_tri_dim_chess && npm run lint`

### Step 6: Setup Tests
Command: `cd ~/repos/open_tri_dim_chess && npm run test`

### Step 7: Setup Local App
This will be a web application, so:
"Run `npm run dev` to start the development server. The app will be available at http://localhost:5173. This is a 3D chess game built with React and Three.js."

### Step 8: Additional Notes
Skip unless specific issues arise during implementation.

## Next Steps
1. Get user approval for this plan
2. Initialize the Vite project structure
3. Install dependencies
4. Begin implementation following the design document's validation-first approach