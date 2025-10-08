import { MoveContext, MoveValidation } from '../types';
import { isPurelyVerticalMove, isPathClear } from '../pathValidation';

/**
 * Validates Rook movement according to Meder's rules.
 *
 * Rules:
 * - Moves any number of squares along a rank or file
 * - Can cross between boards/levels
 * - Path must be clear (subject to Vertical Shadow rule)
 * - Cannot make purely vertical moves (same file+rank, different level)
 *
 * Reference: Section 3.1 of move_logic_tests.md
 */
export function validateRookMove(context: MoveContext): MoveValidation {
  const { fromSquare, toSquare, piece, allPieces, world } = context;

  // Check for purely vertical move (prohibited)
  if (isPurelyVerticalMove(fromSquare, toSquare)) {
    return {
      valid: false,
      reason: 'Rooks cannot move purely vertically (same file and rank, different level)'
    };
  }

  // Rook must move along file OR rank (not diagonal)
  const isFileLine = fromSquare.file === toSquare.file;
  const isRankLine = fromSquare.rank === toSquare.rank;

  if (!isFileLine && !isRankLine) {
    return {
      valid: false,
      reason: 'Rooks can only move along files or ranks'
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
