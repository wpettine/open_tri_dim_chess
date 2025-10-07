import { create } from 'zustand';
import type { ChessWorld } from '../engine/world/types';
import { createChessWorld } from '../engine/world/worldBuilder';
import { createInitialPieces } from '../engine/initialSetup';
import { getLegalMovesAvoidingCheck, isInCheck, isCheckmate, isStalemate } from '../engine/validation/checkDetection';
import { createSquareId } from '../engine/world/coordinates';
import { getInitialPinPositions } from '../engine/world/pinPositions';

export interface Piece {
  id: string;
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
  file: number;
  rank: number;
  level: string;
  hasMoved: boolean;
}

export type Move = 
  | {
      type: 'piece-move';
      from: string;
      to: string;
      piece: { type: string; color: 'white' | 'black' };
    }
  | {
      type: 'board-move';
      from: string;
      to: string;
      boardId: string;
      rotation?: number;
    };

export interface GameState {
  world: ChessWorld;
  pieces: Piece[];
  currentTurn: 'white' | 'black';
  selectedSquareId: string | null;
  highlightedSquareIds: string[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  winner: 'white' | 'black' | null;
  gameOver: boolean;
  attackBoardPositions: Record<string, string>;
  selectedBoardId: string | null;
  moveHistory: Move[];
  selectSquare: (squareId: string) => void;
  movePiece: (piece: Piece, toFile: number, toRank: number, toLevel: string) => void;
  clearSelection: () => void;
  resetGame: () => void;
  getValidMovesForSquare: (squareId: string) => string[];
  updateGameState: () => void;
}

function boardIdToLevel(boardId: string): string {
  if (boardId === 'WL') return 'W';
  if (boardId === 'NL') return 'N';
  if (boardId === 'BL') return 'B';
  return boardId;
}

export const useGameStore = create<GameState>()((set, get) => ({
  world: createChessWorld(),
  pieces: createInitialPieces(),
  currentTurn: 'white',
  selectedSquareId: null,
  highlightedSquareIds: [],
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  winner: null,
  gameOver: false,
  attackBoardPositions: getInitialPinPositions(),
  selectedBoardId: null,
  moveHistory: [],
  
  selectSquare: (squareId: string) => {
    const state = get();
    
    if (state.gameOver) {
      return;
    }
    
    if (!state.selectedSquareId) {
      const piece = state.pieces.find((p) => {
        const pieceSquareId = createSquareId(p.file, p.rank, p.level);
        return pieceSquareId === squareId;
      });
      
      if (piece && piece.color === state.currentTurn) {
        const validMoves = get().getValidMovesForSquare(squareId);
        set({ 
          selectedSquareId: squareId,
          highlightedSquareIds: validMoves,
        });
      }
    } else {
      if (state.highlightedSquareIds.includes(squareId)) {
        const selectedPiece = state.pieces.find((p) => {
          const pieceSquareId = createSquareId(p.file, p.rank, p.level);
          return pieceSquareId === state.selectedSquareId;
        });
        
        if (selectedPiece) {
          const targetSquare = Array.from(state.world.squares.values()).find(
            (sq) => sq.id === squareId
          );
          if (targetSquare) {
            get().movePiece(selectedPiece, targetSquare.file, targetSquare.rank, boardIdToLevel(targetSquare.boardId));
          }
        }
      } else {
        const piece = state.pieces.find((p) => {
          const pieceSquareId = createSquareId(p.file, p.rank, p.level);
          return pieceSquareId === squareId;
        });
        
        if (piece && piece.color === state.currentTurn) {
          const validMoves = get().getValidMovesForSquare(squareId);
          set({ 
            selectedSquareId: squareId,
            highlightedSquareIds: validMoves,
          });
        } else {
          set({ selectedSquareId: null, highlightedSquareIds: [] });
        }
      }
    }
  },
  
  movePiece: (piece: Piece, toFile: number, toRank: number, toLevel: string) => {
    const state = get();
    
    const capturedPiece = state.pieces.find(
      (p) => p.file === toFile && p.rank === toRank && p.level === toLevel
    );
    
    const updatedPieces = state.pieces.filter((p) => p.id !== capturedPiece?.id);
    
    const movedPieceIndex = updatedPieces.findIndex((p) => p.id === piece.id);
    if (movedPieceIndex !== -1) {
      updatedPieces[movedPieceIndex] = {
        ...piece,
        file: toFile,
        rank: toRank,
        level: toLevel,
        hasMoved: true,
      };
    }
    
    const fromSquare = state.world.squares.get(createSquareId(piece.file, piece.rank, piece.level));
    const toSquare = state.world.squares.get(createSquareId(toFile, toRank, toLevel));
    const move: Move = {
      type: 'piece-move',
      from: fromSquare?.id || '',
      to: toSquare?.id || '',
      piece: { type: piece.type, color: piece.color },
    };
    
    const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';
    
    const checkStatus = isInCheck(nextTurn, state.world, updatedPieces);
    const checkmateStatus = isCheckmate(nextTurn, state.world, updatedPieces);
    const stalemateStatus = isStalemate(nextTurn, state.world, updatedPieces);
    
    set({
      pieces: updatedPieces,
      moveHistory: [...state.moveHistory, move],
      currentTurn: nextTurn,
      selectedSquareId: null,
      highlightedSquareIds: [],
      isCheck: checkStatus,
      isCheckmate: checkmateStatus,
      isStalemate: stalemateStatus,
      gameOver: checkmateStatus || stalemateStatus,
      winner: checkmateStatus ? state.currentTurn : (stalemateStatus ? null : state.winner),
    });
  },
  
  clearSelection: () => {
    set({ selectedSquareId: null, highlightedSquareIds: [], selectedBoardId: null });
  },
  
  resetGame: () => {
    set({
      world: createChessWorld(),
      pieces: createInitialPieces(),
      currentTurn: 'white',
      selectedSquareId: null,
      highlightedSquareIds: [],
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      winner: null,
      gameOver: false,
      attackBoardPositions: getInitialPinPositions(),
      selectedBoardId: null,
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

    return getLegalMovesAvoidingCheck(piece, state.world, state.pieces);
  },

  updateGameState: () => {
    const state = get();
    const currentPlayer = state.currentTurn;

    const checkStatus = isInCheck(currentPlayer, state.world, state.pieces);
    const checkmateStatus = isCheckmate(currentPlayer, state.world, state.pieces);
    const stalemateStatus = isStalemate(currentPlayer, state.world, state.pieces);

    set({
      isCheck: checkStatus,
      isCheckmate: checkmateStatus,
      isStalemate: stalemateStatus,
      winner: checkmateStatus 
        ? (currentPlayer === 'white' ? 'black' : 'white')
        : (stalemateStatus ? null : state.winner),
    });
  },
}));
