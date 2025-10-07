import { MoveValidationContext, MoveResult } from './types';
import { isPathClear, isPieceAt } from './pathValidation';
import { ChessWorld } from '../world/types';
import { Piece } from '../../store/gameStore';

function parseLevelFromSquareId(squareId: string): string {
  const match = squareId.match(/^[a-z]\d+(.+)$/);
  return match ? match[1] : '';
}

function isCoordinateBlockedByAnyLevel(
  file: number,
  rank: number,
  world: ChessWorld,
  pieces: Piece[]
): boolean {
  const squareIds: string[] = [];
  
  for (const [squareId, square] of world.squares) {
    if (square.file === file && square.rank === rank) {
      squareIds.push(squareId);
    }
  }
  
  for (const squareId of squareIds) {
    if (isPieceAt(squareId, pieces)) {
      return true;
    }
  }
  
  return false;
}

export function validatePawnMove(context: MoveValidationContext): MoveResult {
  const { piece, fromSquare, toSquare, allPieces, world } = context;

  const fileChange = toSquare.file - fromSquare.file;
  const rankChange = toSquare.rank - fromSquare.rank;
  const direction = piece.color === 'white' ? 1 : -1;

  const toLevel = parseLevelFromSquareId(toSquare.id);

  const destinationBlocked = isCoordinateBlockedByAnyLevel(
    toSquare.file,
    toSquare.rank,
    world,
    allPieces
  );

  const enemyAtDestination = allPieces.some(
    (p) =>
      p.file === toSquare.file &&
      p.rank === toSquare.rank &&
      p.level === toLevel &&
      p.color !== piece.color
  );

  if (Math.abs(fileChange) === 1 && rankChange === direction && enemyAtDestination) {
    return { valid: true };
  }

  if (fileChange === 0 && rankChange === direction && !destinationBlocked) {
    return { valid: true };
  }

  if (fileChange === 0 && rankChange === 2 * direction && !piece.hasMoved && !destinationBlocked) {
    const intermediateRank = fromSquare.rank + direction;
    
    const intermediateBlocked = isCoordinateBlockedByAnyLevel(
      fromSquare.file,
      intermediateRank,
      world,
      allPieces
    );

    if (!intermediateBlocked) {
      return { valid: true };
    }
  }

  return { valid: false, reason: 'invalid pawn move' };
}

export function validateRookMove(context: MoveValidationContext): MoveResult {
  const { fromSquare, toSquare, world, allPieces } = context;

  const fileChange = toSquare.file - fromSquare.file;
  const rankChange = toSquare.rank - fromSquare.rank;
  const fromLevel = parseLevelFromSquareId(fromSquare.id);
  const toLevel = parseLevelFromSquareId(toSquare.id);
  const levelChange = fromLevel !== toLevel;

  if (levelChange && fileChange === 0 && rankChange === 0) {
    return { valid: false, reason: 'pure vertical movement prohibited' };
  }

  const movesOnOneAxis =
    (fileChange !== 0 && rankChange === 0) ||
    (fileChange === 0 && rankChange !== 0) ||
    (fileChange !== 0 && rankChange !== 0 && levelChange);

  if (!movesOnOneAxis) {
    return { valid: false, reason: 'rook must move in straight line' };
  }

  if (!isPathClear(fromSquare, toSquare, world, allPieces)) {
    return { valid: false, reason: 'path blocked by vertical shadow' };
  }

  return { valid: true };
}

export function validateKnightMove(context: MoveValidationContext): MoveResult {
  const { fromSquare, toSquare } = context;

  const fileChange = Math.abs(toSquare.file - fromSquare.file);
  const rankChange = Math.abs(toSquare.rank - fromSquare.rank);

  const fromLevel = parseLevelFromSquareId(fromSquare.id);
  const toLevel = parseLevelFromSquareId(toSquare.id);
  
  const levelMap: Record<string, number> = {
    W: 0,
    N: 1,
    B: 2,
    QL1: -1,
    QL6: 3,
    KL1: -1,
    KL6: 3,
  };

  const levelChange = Math.abs(
    (levelMap[toLevel] || 0) - (levelMap[fromLevel] || 0)
  );

  const validLShape =
    (fileChange === 2 && rankChange === 1 && levelChange === 0) ||
    (fileChange === 1 && rankChange === 2 && levelChange === 0) ||
    (fileChange === 2 && levelChange === 1 && rankChange === 0) ||
    (fileChange === 1 && levelChange === 2 && rankChange === 0) ||
    (rankChange === 2 && levelChange === 1 && fileChange === 0) ||
    (rankChange === 1 && levelChange === 2 && fileChange === 0);

  if (!validLShape) {
    return { valid: false, reason: 'invalid knight move' };
  }

  return { valid: true };
}

export function validateBishopMove(context: MoveValidationContext): MoveResult {
  const { fromSquare, toSquare, world, allPieces } = context;

  const fileChange = Math.abs(toSquare.file - fromSquare.file);
  const rankChange = Math.abs(toSquare.rank - fromSquare.rank);
  const fromLevel = parseLevelFromSquareId(fromSquare.id);
  const toLevel = parseLevelFromSquareId(toSquare.id);
  const levelChange = fromLevel !== toLevel;

  if (levelChange && fileChange === 0 && rankChange === 0) {
    return { valid: false, reason: 'pure vertical movement prohibited' };
  }

  const levelMap: Record<string, number> = {
    W: 0,
    N: 1,
    B: 2,
    QL1: -1,
    QL6: 3,
    KL1: -1,
    KL6: 3,
  };

  const levelDiff = Math.abs(
    (levelMap[toLevel] || 0) - (levelMap[fromLevel] || 0)
  );

  const validDiagonal =
    (fileChange === rankChange && fileChange > 0) ||
    (fileChange === levelDiff && fileChange > 0 && rankChange === 0) ||
    (rankChange === levelDiff && rankChange > 0 && fileChange === 0);

  if (!validDiagonal) {
    return { valid: false, reason: 'bishop must move diagonally' };
  }

  if (!isPathClear(fromSquare, toSquare, world, allPieces)) {
    return { valid: false, reason: 'path blocked by vertical shadow' };
  }

  return { valid: true };
}

export function validateQueenMove(context: MoveValidationContext): MoveResult {
  const rookResult = validateRookMove(context);
  if (rookResult.valid) {
    return rookResult;
  }

  const bishopResult = validateBishopMove(context);
  if (bishopResult.valid) {
    return bishopResult;
  }

  return { valid: false, reason: 'invalid queen move' };
}

export function validateKingMove(context: MoveValidationContext): MoveResult {
  const { fromSquare, toSquare } = context;

  const fileChange = Math.abs(toSquare.file - fromSquare.file);
  const rankChange = Math.abs(toSquare.rank - fromSquare.rank);
  const fromLevel = parseLevelFromSquareId(fromSquare.id);
  const toLevel = parseLevelFromSquareId(toSquare.id);
  const levelChange = fromLevel !== toLevel;

  if (levelChange && fileChange === 0 && rankChange === 0) {
    return { valid: false, reason: 'pure vertical movement prohibited' };
  }

  const maxDistance = Math.max(fileChange, rankChange);

  if (maxDistance > 1) {
    return { valid: false, reason: 'king can only move one square' };
  }

  return { valid: true };
}
