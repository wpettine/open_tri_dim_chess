import { MoveContext, MoveValidation } from '../types';
import { getPieceAtSquare, isPurelyVerticalMove, isDestinationBlockedByVerticalShadow } from '../pathValidation';

/**
 * Validates Pawn movement according to Meder's rules.
 *
 * Rules:
 * - Moves forward 1 square (2 from starting position if not moved)
 * - Captures diagonally forward (can change levels)
 * - Cannot capture forward
 * - Cannot make purely vertical moves (same file+rank, different level)
 * - Pawns that moved as passengers lose double-move privilege
 * - Can transition between levels on diagonal captures
 *
 * Reference: Section 3.6 of move_logic_tests.md
 */
export function validatePawnMove(context: MoveContext): MoveValidation {
  const { fromSquare, toSquare, piece, allPieces } = context;

  // Pawns cannot make purely vertical moves
  if (isPurelyVerticalMove(fromSquare, toSquare)) {
    return {
      valid: false,
      reason: 'Pawns cannot move purely vertically (same file and rank, different level)'
    };
  }

  // Determine forward direction based on color
  const forwardDir = piece.color === 'white' ? 1 : -1;

  const fileDist = toSquare.file - fromSquare.file;
  const rankDist = toSquare.rank - fromSquare.rank;
  const absFileDist = Math.abs(fileDist);
  const absRankDist = Math.abs(rankDist);

  // Check if moving in correct direction (forward for player's color)
  const isMovingForward = (rankDist * forwardDir) > 0;

  if (!isMovingForward && rankDist !== 0) {
    return {
      valid: false,
      reason: 'Pawns can only move forward'
    };
  }

  const pieceAtDest = getPieceAtSquare(toSquare.id, allPieces);

  // Case 1: Forward movement (no capture)
  if (absFileDist === 0) {
    // Cannot capture on forward move
    if (pieceAtDest) {
      return {
        valid: false,
        reason: 'Pawns cannot capture while moving forward'
      };
    }

    // Check for vertical shadow blocking at destination
    if (isDestinationBlockedByVerticalShadow(toSquare, allPieces, context.world)) {
      return {
        valid: false,
        reason: 'Destination is blocked by vertical shadow from another level'
      };
    }

    // Single step forward
    if (absRankDist === 1) {
      return { valid: true };
    }

    // Double step forward from starting position
    if (absRankDist === 2) {
      // Check if pawn has not moved and is not a passenger
      if (piece.hasMoved || piece.movedAsPassenger) {
        return {
          valid: false,
          reason: 'Pawns can only move 2 squares on their first move'
        };
      }

      // Check if starting from correct rank
      // White: rank 1 (attack boards) or rank 2 (main board)
      // Black: rank 8 (attack boards) or rank 7 (main board)
      const validStartingRanks = piece.color === 'white' ? [1, 2] : [7, 8];
      if (!validStartingRanks.includes(fromSquare.rank)) {
        return {
          valid: false,
          reason: 'Pawns can only double-move from their starting rank'
        };
      }

      // Check if path is clear (middle square must be empty)
      const middleRank = fromSquare.rank + forwardDir;
      const middleSquareId = `${String.fromCharCode(97 + fromSquare.file - 1)}${middleRank}${fromSquare.boardId}`;
      const pieceInMiddle = getPieceAtSquare(middleSquareId, allPieces);
      if (pieceInMiddle) {
        return {
          valid: false,
          reason: 'Path is blocked'
        };
      }

      return { valid: true };
    }

    return {
      valid: false,
      reason: 'Pawns can only move 1 or 2 squares forward'
    };
  }

  // Case 2: Diagonal capture
  if (absFileDist === 1 && absRankDist === 1) {
    if (!pieceAtDest) {
      // TODO: Check for en passant
      return {
        valid: false,
        reason: 'Pawns can only move diagonally when capturing'
      };
    }

    if (pieceAtDest.color === piece.color) {
      return {
        valid: false,
        reason: 'Cannot capture your own piece'
      };
    }

    // Valid diagonal capture (can change levels)
    return { valid: true };
  }

  return {
    valid: false,
    reason: 'Invalid pawn move'
  };
}
