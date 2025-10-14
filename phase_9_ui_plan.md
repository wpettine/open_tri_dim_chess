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
