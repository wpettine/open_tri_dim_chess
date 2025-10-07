import { Piece } from '../../store/gameStore';
import { ChessWorld, WorldSquare } from '../world/types';

export interface MoveValidationContext {
  piece: Piece;
  fromSquare: WorldSquare;
  toSquare: WorldSquare;
  world: ChessWorld;
  allPieces: Piece[];
}

export interface MoveResult {
  valid: boolean;
  reason?: string;
}

export interface PathCoordinate {
  file: number;
  rank: number;
}
