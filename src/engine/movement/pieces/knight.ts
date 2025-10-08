import { MoveContext, MoveValidation } from '../types';
import { getPieceAtSquare } from '../pathValidation';

/**
 * Validates Knight movement according to Meder's rules.
 *
 * Rules:
 * - Moves in an "L" shape: 2 squares in one direction, 1 square perpendicular
 * - Can cross between boards/levels
 * - IGNORES Vertical Shadow rule (can jump over pieces)
 * - Can land on any valid square (empty or enemy piece)
 *
 * Reference: Section 3.5 of move_logic_tests.md
 */
export function validateKnightMove(context: MoveContext): MoveValidation {
  const { fromSquare, toSquare, piece, allPieces } = context;

  const fileDist = Math.abs(toSquare.file - fromSquare.file);
  const rankDist = Math.abs(toSquare.rank - fromSquare.rank);

  // Knight moves in L-shape: (2,1) or (1,2)
  const isValidLShape =
    (fileDist === 2 && rankDist === 1) ||
    (fileDist === 1 && rankDist === 2);

  if (!isValidLShape) {
    return {
      valid: false,
      reason: 'Knights must move in an L-shape (2 squares + 1 square perpendicular)'
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

  // Knight ignores vertical shadows and can jump over pieces
  return {
    valid: true
  };
}
