import { MoveContext, MoveValidation } from '../types';
import { isPurelyVerticalMove, isPathClear } from '../pathValidation';

/**
 * Validates Bishop movement according to Meder's rules.
 *
 * Rules:
 * - Moves any number of squares diagonally
 * - Can cross between boards/levels
 * - Path must be clear (subject to Vertical Shadow rule)
 * - Cannot make purely vertical moves (same file+rank, different level)
 *
 * Reference: Section 3.2 of move_logic_tests.md
 */
export function validateBishopMove(context: MoveContext): MoveValidation {
  const { fromSquare, toSquare, piece, allPieces, world } = context;

  // Check for purely vertical move (prohibited)
  if (isPurelyVerticalMove(fromSquare, toSquare)) {
    return {
      valid: false,
      reason: 'Bishops cannot move purely vertically (same file and rank, different level)'
    };
  }

  // Bishop must move diagonally (equal file and rank displacement)
  const fileDist = Math.abs(toSquare.file - fromSquare.file);
  const rankDist = Math.abs(toSquare.rank - fromSquare.rank);

  if (fileDist !== rankDist || fileDist === 0) {
    return {
      valid: false,
      reason: 'Bishops can only move diagonally'
    };
  }

  // Path must be clear (respects vertical shadow)
  if (!isPathClear(fromSquare, toSquare, allPieces, piece.color, world, false)) {
    return {
      valid: false,
      reason: 'Path is blocked by another piece or vertical shadow'
    };
  }

  return {
    valid: true
  };
}
