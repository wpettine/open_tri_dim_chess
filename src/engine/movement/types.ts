import { PieceType, Color } from '../types';
import { WorldSquare, ChessWorld } from '../world/types';

/**
 * Represents a single movement step along a path.
 * Used for validating paths and detecting obstructions.
 */
export interface PathStep {
  square: WorldSquare;
  fileRankKey: string;  // "file-rank" key for vertical shadow detection (e.g., "2-3")
}

/**
 * Result of a move validation check.
 */
export interface MoveValidation {
  valid: boolean;
  reason?: string;  // Explanation if invalid
}

/**
 * Piece state needed for movement validation.
 */
export interface PieceState {
  id: string;
  type: PieceType;
  color: Color;
  squareId: string;
  hasMoved: boolean;          // For castling, pawn double-move
  movedAsPassenger?: boolean; // For pawns that moved with attack board
}

/**
 * Context needed for validating any move.
 */
export interface MoveContext {
  piece: PieceState;
  fromSquare: WorldSquare;
  toSquare: WorldSquare;
  allPieces: PieceState[];
  world: ChessWorld;          // Full world grid for path checking
  currentTurn: Color;
  lastMove?: {
    from: string;
    to: string;
    piece: PieceType;
  };
}

/**
 * Direction vector for movement calculation.
 */
export interface Direction {
  fileDir: number;  // -1, 0, or 1
  rankDir: number;  // -1, 0, or 1
  levelDir: number; // -1, 0, or 1 (for vertical movement)
}
