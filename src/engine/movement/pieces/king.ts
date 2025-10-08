import { MoveContext, MoveValidation } from '../types';
import { getPieceAtSquare, isPurelyVerticalMove, isDestinationBlockedByVerticalShadow } from '../pathValidation';

/**
 * Validates King movement according to Meder's rules.
 *
 * Rules:
 * - Moves one square in any direction (rank, file, or diagonal)
 * - Can move to adjacent square on different level
 * - Cannot make purely vertical moves (same file+rank, different level)
 * - Cannot move into check (square attacked by enemy)
 * - Cannot capture own pieces
 *
 * Reference: Section 3.4 of move_logic_tests.md
 */
export function validateKingMove(context: MoveContext): MoveValidation {
  const { fromSquare, toSquare, piece, allPieces } = context;

  // King cannot make purely vertical moves
  if (isPurelyVerticalMove(fromSquare, toSquare)) {
    return {
      valid: false,
      reason: 'Kings cannot move purely vertically (same file and rank, different level)'
    };
  }

  const fileDist = Math.abs(toSquare.file - fromSquare.file);
  const rankDist = Math.abs(toSquare.rank - fromSquare.rank);

  // King can move exactly one square in any direction
  // This includes diagonal and level transitions
  if (fileDist > 1 || rankDist > 1) {
    return {
      valid: false,
      reason: 'King can only move one square in any direction'
    };
  }

  // Must actually move somewhere
  if (fileDist === 0 && rankDist === 0 && fromSquare.boardId === toSquare.boardId) {
    return {
      valid: false,
      reason: 'King must move to a different square'
    };
  }

  // Check destination square
  const pieceAtDest = getPieceAtSquare(toSquare.id, allPieces);

  if (pieceAtDest && pieceAtDest.color === piece.color) {
    return {
      valid: false,
      reason: 'Cannot capture your own piece'
    };
  }

  // Check for vertical shadow blocking at destination
  if (isDestinationBlockedByVerticalShadow(toSquare, allPieces, context.world)) {
    return {
      valid: false,
      reason: 'Destination is blocked by vertical shadow from another level'
    };
  }

  // TODO: Check if destination square is under attack
  // This requires implementing isSquareUnderAttack function
  // For now, we'll allow the move

  return {
    valid: true
  };
}
