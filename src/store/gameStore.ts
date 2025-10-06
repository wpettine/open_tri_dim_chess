import { create } from 'zustand';
import type { ChessWorld } from '../engine/world/types';
import { createChessWorld } from '../engine/world/worldBuilder';
import { createInitialPieces } from '../engine/initialSetup';

export interface Piece {
  id: string;
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
  file: number;
  rank: number;
  level: string;
  hasMoved: boolean;
}

export interface GameState {
  world: ChessWorld;
  pieces: Piece[];
  currentTurn: 'white' | 'black';
  selectedSquareId: string | null;
  moveHistory: Array<{
    from: string;
    to: string;
    piece: string;
  }>;
  selectSquare: (squareId: string) => void;
  clearSelection: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()((set) => ({
  world: createChessWorld(),
  pieces: createInitialPieces(),
  currentTurn: 'white',
  selectedSquareId: null,
  moveHistory: [],
  
  selectSquare: (squareId: string) => {
    set({ selectedSquareId: squareId });
  },
  
  clearSelection: () => {
    set({ selectedSquareId: null });
  },
  
  resetGame: () => {
    set({
      world: createChessWorld(),
      pieces: createInitialPieces(),
      currentTurn: 'white',
      selectedSquareId: null,
      moveHistory: [],
    });
  },
}));
