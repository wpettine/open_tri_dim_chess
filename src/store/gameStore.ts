import { create } from 'zustand';
import { ChessWorld } from '../engine/world/types';
import { createChessWorld } from '../engine/world/worldBuilder';
import { Piece, createInitialPieces } from '../engine/initialSetup';
import { isValidMove, getValidMoves, PieceState } from '../engine/movement';
import { createSquareId } from '../engine/world/coordinates';
import { validateBoardMove } from '../engine/attackBoards/validator';
import { executeBoardMove } from '../engine/attackBoards/executor';
import { getAdjacentPins } from '../engine/attackBoards/adjacency';
import { getBoardController } from '../engine/attackBoards/occupancy';
import { BoardRotation } from '../engine/attackBoards/types';

/**
 * Tracks the current pin position of each attack board
 */
export interface AttackBoardPositions {
  WQL: string; // e.g., 'QL1'
  WKL: string; // e.g., 'KL1'
  BQL: string; // e.g., 'QL6'
  BKL: string; // e.g., 'KL6'
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
  attackBoardPositions: AttackBoardPositions;
  selectedBoardId: string | null;
  highlightedPinIds: string[];
}

interface GameStore extends GameState {
  selectSquare: (squareId: string) => void;
  movePiece: (fromSquareId: string, toSquareId: string) => boolean;
  clearSelection: () => void;
  resetGame: () => void;
  getValidMovesForSquare: (squareId: string) => string[];
  selectBoard: (boardId: string) => void;
  moveBoard: (boardId: string, toPinId: string, rotation?: BoardRotation) => boolean;
  getValidPinsForBoard: (boardId: string) => string[];
}

/**
 * Converts Piece to PieceState for movement validation
 */
function pieceToPieceState(piece: Piece): PieceState {
  return {
    id: piece.id,
    type: piece.type,
    color: piece.color,
    squareId: createSquareId(piece.file, piece.rank, piece.level),
    hasMoved: piece.hasMoved,
    movedAsPassenger: piece.movedAsPassenger
  };
}

const initialState: GameState = {
  world: createChessWorld(),
  pieces: createInitialPieces(),
  currentTurn: 'white',
  selectedSquareId: null,
  highlightedSquareIds: [],
  stalemate: false,
  moveHistory: [],
  attackBoardPositions: {
    WQL: 'QL1',
    WKL: 'KL1',
    BQL: 'QL6',
    BKL: 'KL6',
  },
  selectedBoardId: null,
  highlightedPinIds: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  selectSquare: (squareId: string) => {
    const state = get();

    // Find piece at this square
    const piece = state.pieces.find(p =>
      createSquareId(p.file, p.rank, p.level) === squareId
    );

    // If there's a piece and it's the current player's turn
    if (piece && piece.color === state.currentTurn) {
      // Get valid moves for this piece
      const pieceStates = state.pieces.map(pieceToPieceState);
      const validMoves = getValidMoves(piece.id, pieceStates, state.world, state.currentTurn);

      set({
        selectedSquareId: squareId,
        highlightedSquareIds: validMoves,
      });
    } else {
      set({
        selectedSquareId: squareId,
        highlightedSquareIds: [],
      });
    }
  },

  movePiece: (fromSquareId: string, toSquareId: string) => {
    const state = get();

    // Find the piece at fromSquare
    const piece = state.pieces.find(p =>
      createSquareId(p.file, p.rank, p.level) === fromSquareId
    );

    if (!piece) {
      return false;
    }

    // Validate the move
    const pieceStates = state.pieces.map(pieceToPieceState);
    const validation = isValidMove(
      piece.id,
      fromSquareId,
      toSquareId,
      pieceStates,
      state.world,
      state.currentTurn
    );

    if (!validation.valid) {
      console.log('Invalid move:', validation.reason);
      return false;
    }

    // Execute the move
    const toSquare = state.world.squares.get(toSquareId);
    if (!toSquare) {
      return false;
    }

    // Remove captured piece if any
    const capturedPieceIndex = state.pieces.findIndex(p =>
      createSquareId(p.file, p.rank, p.level) === toSquareId
    );

    const newPieces = [...state.pieces];

    if (capturedPieceIndex >= 0) {
      newPieces.splice(capturedPieceIndex, 1);
    }

    // Update piece position
    const pieceIndex = newPieces.findIndex(p => p.id === piece.id);
    if (pieceIndex >= 0) {
      newPieces[pieceIndex] = {
        ...newPieces[pieceIndex],
        file: toSquare.file,
        rank: toSquare.rank,
        level: toSquare.boardId,
        hasMoved: true
      };

      // Check for pawn promotion
      // White pawns promote at rank 9, black pawns at rank 0
      const isPawn = piece.type === 'pawn';
      const promotionRank = piece.color === 'white' ? 9 : 0;
      if (isPawn && toSquare.rank === promotionRank) {
        console.log(`Pawn promoted to Queen at ${toSquareId}`);
        newPieces[pieceIndex].type = 'queen';
      }
    }

    // Switch turns
    const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';

    set({
      pieces: newPieces,
      currentTurn: nextTurn,
      selectedSquareId: null,
      highlightedSquareIds: [],
      moveHistory: [...state.moveHistory, `${fromSquareId}-${toSquareId}`]
    });

    return true;
  },

  getValidMovesForSquare: (squareId: string) => {
    const state = get();
    const piece = state.pieces.find(p =>
      createSquareId(p.file, p.rank, p.level) === squareId
    );

    if (!piece || piece.color !== state.currentTurn) {
      return [];
    }

    const pieceStates = state.pieces.map(pieceToPieceState);
    return getValidMoves(piece.id, pieceStates, state.world, state.currentTurn);
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

  selectBoard: (boardId: string) => {
    const state = get();

    // Check if board is an attack board
    const board = state.world.boards.get(boardId);
    if (!board || board.type !== 'attack') {
      return;
    }

    // Get board owner and controller
    const originalOwner = boardId === 'WQL' || boardId === 'WKL' ? 'white' : 'black';
    const pieceStates = state.pieces.map(pieceToPieceState);
    const controller = getBoardController(boardId, pieceStates, state.world, originalOwner);

    // Only allow selection if current player controls the board
    if (controller !== state.currentTurn) {
      set({
        selectedBoardId: null,
        highlightedPinIds: [],
      });
      return;
    }

    // Get valid pins for this board
    const validPins = get().getValidPinsForBoard(boardId);

    set({
      selectedBoardId: boardId,
      highlightedPinIds: validPins,
      selectedSquareId: null,
      highlightedSquareIds: [],
    });
  },

  moveBoard: (boardId: string, toPinId: string, rotation?: BoardRotation) => {
    const state = get();
    const fromPinId = state.attackBoardPositions[boardId as keyof AttackBoardPositions];

    if (!fromPinId) {
      return false;
    }

    const pieceStates = state.pieces.map(pieceToPieceState);

    // Validate and execute the move
    const result = executeBoardMove({
      boardId,
      fromPinId,
      toPinId,
      rotation,
      pieces: pieceStates,
      world: state.world,
      currentTurn: state.currentTurn,
    });

    if (!result.success) {
      console.log('Invalid board move:', result.reason);
      return false;
    }

    // Update pieces with new positions from executor
    const updatedPieces = state.pieces.map(piece => {
      const updatedState = result.updatedPieces?.find(p => p.id === piece.id);
      if (!updatedState) return piece;

      const newSquare = state.world.squares.get(updatedState.squareId);
      if (!newSquare) return piece;

      return {
        ...piece,
        file: newSquare.file,
        rank: newSquare.rank,
        level: newSquare.boardId,
        movedAsPassenger: updatedState.movedAsPassenger,
      };
    });

    // Update board position
    const newBoardPositions = {
      ...state.attackBoardPositions,
      [boardId]: toPinId,
    };

    // Switch turns
    const nextTurn = state.currentTurn === 'white' ? 'black' : 'white';

    set({
      pieces: updatedPieces,
      attackBoardPositions: newBoardPositions,
      currentTurn: nextTurn,
      selectedBoardId: null,
      highlightedPinIds: [],
      moveHistory: [...state.moveHistory, `${boardId}:${fromPinId}-${toPinId}`],
    });

    return true;
  },

  getValidPinsForBoard: (boardId: string) => {
    const state = get();
    const fromPinId = state.attackBoardPositions[boardId as keyof AttackBoardPositions];

    if (!fromPinId) {
      return [];
    }

    const adjacentPins = getAdjacentPins(fromPinId);
    const pieceStates = state.pieces.map(pieceToPieceState);

    // Filter to only valid pins
    return adjacentPins.filter(pinId => {
      const validation = validateBoardMove({
        boardId,
        fromPinId,
        toPinId: pinId,
        pieces: pieceStates,
        world: state.world,
        currentTurn: state.currentTurn,
      });
      return validation.valid;
    });
  },
}));
