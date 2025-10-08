import { PieceState } from '../movement/types';
import { ChessWorld } from '../world/types';

/**
 * Checks if a board placement would be blocked by Vertical Shadow Rule.
 *
 * From ATTACK_BOARD_RULES.md § 4:
 * "When an attack board moves or is placed so that any of its four overhanging
 * squares would be directly above or below another piece, the move is illegal
 * unless that underlying or overlying piece is a knight."
 */
export function isBlockedByVerticalShadow(
  targetPinId: string,
  pieces: PieceState[],
  world: ChessWorld
): boolean {
  // Get pin position
  const pin = world.pins.get(targetPinId);
  if (!pin) {
    return false; // Unknown pin, let validator handle
  }

  // Calculate the 4 board positions (2x2 attack board)
  const boardPositions = [
    { file: pin.fileOffset, rank: pin.rankOffset },
    { file: pin.fileOffset + 1, rank: pin.rankOffset },
    { file: pin.fileOffset, rank: pin.rankOffset + 1 },
    { file: pin.fileOffset + 1, rank: pin.rankOffset + 1 },
  ];

  // Check each of the 4 positions
  for (const pos of boardPositions) {
    // Find all pieces at this file-rank position (across all levels)
    const blockingPieces = pieces.filter(p => {
      const square = world.squares.get(p.squareId);
      if (!square) return false;

      // Same file and rank, different board/level (vertical alignment)
      // Skip knights (they don't cast shadows)
      if (p.type === 'knight') return false;

      // Check if piece is at the same file-rank but at a different Z height
      const isSameFileRank = square.file === pos.file && square.rank === pos.rank;
      const isDifferentLevel = Math.abs(square.worldZ - pin.zHeight) > 0.1; // Different Z means different level

      return isSameFileRank && isDifferentLevel;
    });

    // If any non-knight piece is vertically aligned, board is blocked
    if (blockingPieces.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Gets all file-rank positions that would be occupied by a board at a pin
 */
export function getBoardFootprint(
  pinId: string,
  world: ChessWorld
): Array<{ file: number; rank: number }> {
  const pin = world.pins.get(pinId);
  if (!pin) {
    return [];
  }

  return [
    { file: pin.fileOffset, rank: pin.rankOffset },
    { file: pin.fileOffset + 1, rank: pin.rankOffset },
    { file: pin.fileOffset, rank: pin.rankOffset + 1 },
    { file: pin.fileOffset + 1, rank: pin.rankOffset + 1 },
  ];
}

/**
 * Finds pieces that would block a board placement (for debugging/UI)
 */
export function getBlockingPieces(
  targetPinId: string,
  pieces: PieceState[],
  world: ChessWorld
): PieceState[] {
  const pin = world.pins.get(targetPinId);
  if (!pin) return [];

  const boardPositions = getBoardFootprint(targetPinId, world);
  const blocking: PieceState[] = [];

  for (const pos of boardPositions) {
    const blockingAtPos = pieces.filter(p => {
      const square = world.squares.get(p.squareId);
      if (!square) return false;

      return (
        square.file === pos.file &&
        square.rank === pos.rank &&
        square.worldZ !== pin.zHeight &&
        p.type !== 'knight'
      );
    });
    blocking.push(...blockingAtPos);
  }

  return blocking;
}
