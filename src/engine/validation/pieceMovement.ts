import { MoveValidationContext, MoveResult } from './types';
import { isPathClear } from './pathValidation';

function parseLevelFromSquareId(squareId: string): string {
  const match = squareId.match(/^[a-z]\d+(.+)$/);
  return match ? match[1] : '';
}

export function validatePawnMove(context: MoveValidationContext): MoveResult {
  const { piece, fromSquare, toSquare, allPieces } = context;

  const fileChange = toSquare.file - fromSquare.file;
  const rankChange = toSquare.rank - fromSquare.rank;
  const direction = piece.color === 'white' ? 1 : -1;

  const toLevel = parseLevelFromSquareId(toSquare.id);
  const fromLevel = parseLevelFromSquareId(fromSquare.id);

  const destinationOccupied = allPieces.some(
    (p) =>
      p.file === toSquare.file &&
      p.rank === toSquare.rank &&
      p.level === toLevel
  );

  const isCapture = destinationOccupied && allPieces.some(
    (p) =>
      p.file === toSquare.file &&
      p.rank === toSquare.rank &&
      p.level === toLevel &&
      p.color !== piece.color
  );

  if (Math.abs(fileChange) === 1 && rankChange === direction && isCapture) {
    return { valid: true };
  }

  if (fileChange === 0 && rankChange === direction && !destinationOccupied) {
    return { valid: true };
  }

  if (fileChange === 0 && rankChange === 2 * direction && !piece.hasMoved && !destinationOccupied) {
    const intermediateRank = fromSquare.rank + direction;
    const intermediateOccupied = allPieces.some(
      (p) =>
        p.file === fromSquare.file &&
        p.rank === intermediateRank &&
        p.level === fromLevel
    );

    if (!intermediateOccupied) {
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
    (fileChange === 2 && rankChange === 1) ||
    (fileChange === 1 && rankChange === 2) ||
    (fileChange === 2 && levelChange === 1) ||
    (fileChange === 1 && levelChange === 2) ||
    (rankChange === 2 && levelChange === 1) ||
    (rankChange === 1 && levelChange === 2);

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
