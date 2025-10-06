import { create } from 'zustand';
import { ChessWorld } from '../engine/world/types';
import { createChessWorld } from '../engine/world/worldBuilder';
import { Piece, createInitialPieces } from '../engine/initialSetup';

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
  pieces: createInitialPieces(),
  currentTurn: 'white',
  selectedSquareId: null,
  highlightedSquareIds: [],
  stalemate: false,
  moveHistory: [],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  selectSquare: (squareId: string) => {
    set({
      selectedSquareId: squareId,
      highlightedSquareIds: [], // Will be populated with valid moves later
    });
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
      pieces: createInitialPieces(),
    });
  },
}));
