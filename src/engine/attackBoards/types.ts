import { PieceState } from '../movement/types';
import { ChessWorld, WorldSquare } from '../world/types';

/**
 * Direction type for board movement
 */
export type BoardDirection = 'forward' | 'side' | 'backward';

/**
 * Quadrant identifier on a 2x2 attack board
 */
export type Quadrant = 'q1' | 'q2' | 'q3' | 'q4';

/**
 * Rotation angle for attack boards
 */
export type BoardRotation = 0 | 180;

/**
 * Attack board movement validation result
 */
export interface BoardMoveValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Context for validating attack board movement
 */
export interface BoardMoveContext {
  boardId: string;
  fromPinId: string;
  toPinId: string;
  rotation?: BoardRotation;
  pieces: PieceState[];
  world: ChessWorld;
  currentTurn: 'white' | 'black';
}

/**
 * Result of executing an attack board move
 */
export interface BoardMoveResult {
  success: boolean;
  updatedPieces?: PieceState[];
  newBoardPosition?: {
    pinId: string;
    rotation: BoardRotation;
  };
  reason?: string;
}

/**
 * Pin adjacency information
 */
export interface PinAdjacency {
  pinId: string;
  adjacent: string[];
}

/**
 * Extended board information with ownership
 */
export interface AttackBoardInfo {
  id: string;
  pinId: string;
  rotation: BoardRotation;
  owner: 'white' | 'black' | null;
  controller: 'white' | 'black' | null;
}
