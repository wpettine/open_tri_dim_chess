import { create } from 'zustand';
import type { ChessWorld } from '../engine/world/types';
import { createChessWorld } from '../engine/world/worldBuilder';
import { createInitialPieces } from '../engine/initialSetup';
import { getLegalMoves } from '../engine/validation/moveValidator';
import { createSquareId } from '../engine/world/coordinates';

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
  highlightedSquareIds: string[];
  moveHistory: Array<{
    from: string;
    to: string;
    piece: string;
  }>;
  selectSquare: (squareId: string) => void;
  clearSelection: () => void;
  resetGame: () => void;
  getValidMovesForSquare: (squareId: string) => string[];
}

export const useGameStore = create<GameState>()((set, get) => ({
  world: createChessWorld(),
  pieces: createInitialPieces(),
  currentTurn: 'white',
  selectedSquareId: null,
  highlightedSquareIds: [],
  moveHistory: [],
  
  selectSquare: (squareId: string) => {
    const validMoves = get().getValidMovesForSquare(squareId);
    set({ 
      selectedSquareId: squareId,
      highlightedSquareIds: validMoves,
    });
  },
  
  clearSelection: () => {
    set({ selectedSquareId: null, highlightedSquareIds: [] });
  },
  
  resetGame: () => {
    set({
      world: createChessWorld(),
      pieces: createInitialPieces(),
      currentTurn: 'white',
      selectedSquareId: null,
      highlightedSquareIds: [],
      moveHistory: [],
    });
  },

  getValidMovesForSquare: (squareId: string) => {
    const state = get();
    
    const piece = state.pieces.find((p) => {
      const pieceSquareId = createSquareId(p.file, p.rank, p.level);
      return pieceSquareId === squareId;
    });

    if (!piece || piece.color !== state.currentTurn) {
      return [];
    }

    return getLegalMoves(piece, state.world, state.pieces);
  },
}));
