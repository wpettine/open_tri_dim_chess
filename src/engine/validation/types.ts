import { Piece } from '../../store/gameStore';
import { ChessWorld, WorldSquare } from '../world/types';

export interface TrackStates {
  QL: {
    whiteBoardPin: number;
    blackBoardPin: number;
    whiteRotation: 0 | 180;
    blackRotation: 0 | 180;
  };
  KL: {
    whiteBoardPin: number;
    blackBoardPin: number;
    whiteRotation: 0 | 180;
    blackRotation: 0 | 180;
  };
}

export interface MoveValidationContext {
  piece: Piece;
  fromSquare: WorldSquare;
  toSquare: WorldSquare;
  world: ChessWorld;
  allPieces: Piece[];
  trackStates?: TrackStates;
  attackBoardStates?: Record<string, { activeInstanceId: string }>;
}

export interface PromotionInfo {
  shouldPromote: boolean;    // True if pawn is at a promotion rank
  canPromote: boolean;        // True if promotion can happen now (not deferred)
  isDeferred: boolean;        // True if promotion is blocked by overhang
  overhangBoardId?: string;   // Which board is blocking (if deferred)
}

export interface MoveResult {
  valid: boolean;
  reason?: string;
  promotion?: PromotionInfo;  // Promotion information (if applicable)
}

export interface PathCoordinate {
  file: number;
  rank: number;
}
