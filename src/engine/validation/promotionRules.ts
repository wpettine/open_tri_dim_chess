/**
 * Pawn Promotion Logic for Tri-Dimensional Chess
 *
 * Implements geometry-dependent promotion rules as defined in
 * REVISED_MEDER_COORDINATE_SYSTEM.md Section 12.
 *
 * Key Concepts:
 * - Furthest rank varies by file (b/c, z/e, a/d)
 * - Corner files (a/d) are dynamic based on overhang
 * - Outer files (z/e) require promotion plane to exist
 * - Deferred promotion on corners with opponent overhang
 * - Forced promotion when overhang removed
 */

import type { Piece } from '../../store/gameStore';
import type { ChessWorld, WorldSquare } from '../world/types';
import { fileToString, createSquareId } from '../world/coordinates';
import { resolveBoardId } from '../../utils/resolveBoardId';

/**
 * TrackStates type from gameStore
 * Represents the current pin positions and rotations of attack boards
 */
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

/**
 * Result of a promotion check
 */
export interface PromotionCheck {
  shouldPromote: boolean;    // True if pawn is at a promotion rank
  canPromote: boolean;        // True if promotion can happen now (not deferred)
  isDeferred: boolean;        // True if promotion is blocked by overhang
  reason?: string;            // Error message if illegal
  overhangBoardId?: string;   // Which board is blocking (if deferred)
}

/**
 * Calculates the furthest rank for a pawn on a given file
 *
 * Returns:
 * - number: The promotion rank for this file/color
 * - null: Promotion plane doesn't exist (z/e files only)
 *
 * Rules (based on pawn movement direction):
 * - White pawns move UPWARD (direction = +1), so promote at HIGH ranks
 * - Black pawns move DOWNWARD (direction = -1), so promote at LOW ranks
 * - Files b, c: Fixed at rank 8 (White) / 1 (Black)
 * - Files z, e: Rank 9/0 if promotion plane exists, null otherwise
 * - Files a, d: Dynamic - 9/0 with overhang, 8/1 without overhang
 */
export function getFurthestRank(
  file: number,
  color: 'white' | 'black',
  trackStates: TrackStates,
  world: ChessWorld,
  attackBoardStates?: Record<string, { activeInstanceId: string }>
): number | null {
  const fileStr = fileToString(file);

  // Files b, c: fixed ranks
  if (fileStr === 'b' || fileStr === 'c') {
    return color === 'white' ? 8 : 1;
  }

  // Files z, e: outer edge (if exists)
  if (fileStr === 'z' || fileStr === 'e') {
    const promotionRank = color === 'white' ? 9 : 0;
    return promotionSquareExists(file, promotionRank, color, trackStates, world, attackBoardStates)
      ? promotionRank
      : null;
  }

  // Files a, d: dynamic based on overhang
  if (fileStr === 'a' || fileStr === 'd') {
    const hasOverhang = checkCornerOverhang(file, color, trackStates);

    if (hasOverhang) {
      // With overhang: promotion at rank 9/0
      const promotionRank = color === 'white' ? 9 : 0;
      return promotionSquareExists(file, promotionRank, color, trackStates, world, attackBoardStates)
        ? promotionRank
        : null;
    } else {
      // Without overhang: promotion at rank 8/1
      return color === 'white' ? 8 : 1;
    }
  }

  return null; // Invalid file
}

/**
 * Checks if a promotion square exists in the current geometry
 *
 * For z/e files, verifies that the attack board is at the correct pin
 * For a/d files with overhang, same check applies
 * For other cases, checks if square exists in world
 */
export function promotionSquareExists(
  file: number,
  rank: number,
  color: 'white' | 'black',
  trackStates: TrackStates,
  world: ChessWorld,
  attackBoardStates?: Record<string, { activeInstanceId: string }>
): boolean {
  const fileStr = fileToString(file);

  // For z/e files, check if OPPONENT's attack board is at the required pin
  // White promotes at rank 9 on opponent's board (BLACK at pin 6)
  // Black promotes at rank 0 on opponent's board (WHITE at pin 1)
  if (fileStr === 'z' || fileStr === 'e') {
    const track = fileStr === 'z' ? 'QL' : 'KL';
    const opponentKey = color === 'white' ? 'blackBoardPin' : 'whiteBoardPin';
    const opponentPin = trackStates[track][opponentKey];
    const requiredPin = color === 'white' ? 6 : 1;

    if (opponentPin !== requiredPin) {
      return false; // Opponent's board not at outer edge
    }
  }

  // For a/d files at rank 9/0, check if OPPONENT's attack board is at the required pin
  // White promotes at rank 9 on BLACK's board (pin 6)
  // Black promotes at rank 0 on WHITE's board (pin 1)
  if ((fileStr === 'a' || fileStr === 'd') && (rank === 9 || rank === 0)) {
    const track = fileStr === 'a' ? 'QL' : 'KL';
    const opponentKey = color === 'white' ? 'blackBoardPin' : 'whiteBoardPin';
    const opponentPin = trackStates[track][opponentKey];
    const requiredPin = color === 'white' ? 6 : 1;

    if (opponentPin !== requiredPin) {
      return false; // Opponent's board not at the promotion edge
    }
  }

  // Build square ID and check existence
  const boardId = determineBoardId(file, rank, color, trackStates, attackBoardStates);
  const squareId = createSquareId(file, rank, boardId);

  return world.squares.has(squareId);
}

/**
 * Determines which board a square is on based on file, rank, and current attack board positions
 */
export function determineBoardId(
  file: number,
  rank: number,
  color: 'white' | 'black',
  trackStates: TrackStates,
  attackBoardStates?: Record<string, { activeInstanceId: string }>
): string {
  const fileStr = fileToString(file);

  // Main board squares (files a,b,c,d)
  if (fileStr === 'a' || fileStr === 'b' || fileStr === 'c' || fileStr === 'd') {
    // Determine which main board by rank
    if (rank >= 1 && rank <= 4) return 'W';   // White main board
    if (rank >= 3 && rank <= 6) return 'N';   // Neutral board
    if (rank >= 5 && rank <= 8) return 'B';   // Black main board
  }

  // Attack board squares (files z/a for QL, d/e for KL)
  // Determine ownership by rank: high ranks (8-9) are Black's, low ranks (0-1) are White's
  if (fileStr === 'z' || fileStr === 'a') {
    // Queen's Line track - determine which board by rank
    const boardOwner = rank >= 5 ? 'black' : 'white';
    const boardKey = boardOwner === 'white' ? 'WQL' : 'BQL';
    if (attackBoardStates?.[boardKey]) {
      return attackBoardStates[boardKey].activeInstanceId;
    }
    // Fallback: calculate instance ID from trackStates
    const pin = boardOwner === 'white' ? trackStates.QL.whiteBoardPin : trackStates.QL.blackBoardPin;
    const rotation = boardOwner === 'white' ? trackStates.QL.whiteRotation : trackStates.QL.blackRotation;
    return `QL${pin}:${rotation}`;
  }

  if (fileStr === 'd' || fileStr === 'e') {
    // King's Line track - determine which board by rank
    const boardOwner = rank >= 5 ? 'black' : 'white';
    const boardKey = boardOwner === 'white' ? 'WKL' : 'BKL';
    if (attackBoardStates?.[boardKey]) {
      return attackBoardStates[boardKey].activeInstanceId;
    }
    // Fallback: calculate instance ID from trackStates
    const pin = boardOwner === 'white' ? trackStates.KL.whiteBoardPin : trackStates.KL.blackBoardPin;
    const rotation = boardOwner === 'white' ? trackStates.KL.whiteRotation : trackStates.KL.blackRotation;
    return `KL${pin}:${rotation}`;
  }

  return 'W'; // Default fallback
}

/**
 * Checks if there is an opponent attack board overhang at a corner
 *
 * Corners are (based on pawn movement direction):
 * - White: a8B, d8B (rank 8 on Black main board, files a/d) - when moving upward toward rank 9
 * - Black: a1W, d1W (rank 1 on White main board, files a/d) - when moving downward toward rank 0
 *
 * Overhang occurs when the opponent's attack board extends over the corner:
 * - For White (moving upward): Black board at pin 6 extends to rank 9
 * - For Black (moving downward): White board at pin 1 extends to rank 0
 */
export function checkCornerOverhang(
  file: number,
  color: 'white' | 'black',
  trackStates: TrackStates
): boolean {
  const fileStr = fileToString(file);

  // Only corners are affected (files a, d)
  if (fileStr !== 'a' && fileStr !== 'd') {
    return false;
  }

  // Determine which track
  const track = fileStr === 'a' ? 'QL' : 'KL';

  // Get opponent's board position on this track
  const opponentColor = color === 'white' ? 'black' : 'white';
  const opponentKey = opponentColor === 'white' ? 'whiteBoardPin' : 'blackBoardPin';
  const opponentPin = trackStates[track][opponentKey];

  // Check if opponent's board is at the corner pin that creates overhang
  // For White (moving toward rank 9), check if Black board at pin 6
  // For Black (moving toward rank 0), check if White board at pin 1
  const cornerPin = color === 'white' ? 6 : 1;

  return opponentPin === cornerPin;
}

/**
 * Performs a full promotion check for a pawn moving to a square
 *
 * Returns complete information about whether promotion should occur,
 * whether it can occur, and whether it's deferred.
 */
export function checkPromotion(
  piece: Piece,
  toSquare: WorldSquare,
  trackStates: TrackStates,
  world: ChessWorld,
  attackBoardStates?: Record<string, { activeInstanceId: string }>
): PromotionCheck {
  // Only pawns can promote
  if (piece.type !== 'pawn') {
    return {
      shouldPromote: false,
      canPromote: false,
      isDeferred: false,
    };
  }

  const fileStr = fileToString(toSquare.file);
  const isCornerFile = fileStr === 'a' || fileStr === 'd';

  // Special case: Corner promotion squares (separate from furthest rank logic)
  // These are where deferred promotion can occur when opponent overhang is present
  // White: a8B/d8B (rank 8 on corner files) - the square before the overhang at rank 9
  // Black: a1W/d1W (rank 1 on corner files) - the square before the overhang at rank 0
  const isCornerPromotionSquare =
    isCornerFile &&
    ((piece.color === 'white' && toSquare.rank === 8) ||
     (piece.color === 'black' && toSquare.rank === 1));

  if (isCornerPromotionSquare) {
    const hasOverhang = checkCornerOverhang(toSquare.file, piece.color, trackStates);

    if (hasOverhang) {
      // Deferred promotion - opponent's attack board is overhead
      const track = fileStr === 'a' ? 'QL' : 'KL';
      const opponentColor = piece.color === 'white' ? 'black' : 'white';
      const boardId =
        opponentColor === 'white'
          ? track === 'QL'
            ? 'WQL'
            : 'WKL'
          : track === 'QL'
          ? 'BQL'
          : 'BKL';

      return {
        shouldPromote: true,
        canPromote: false,
        isDeferred: true,
        overhangBoardId: boardId,
      };
    }
    // Without overhang, rank 8/1 corners are not promotion squares
    // Fall through to check furthest rank (which will be rank 1 for White, rank 8 for Black)
  }

  // Normal case: Check if at furthest rank (for non-corner squares and outer edge squares)
  const furthestRank = getFurthestRank(
    toSquare.file,
    piece.color,
    trackStates,
    world,
    attackBoardStates
  );

  // Missing promotion plane (z/e files only)
  if (furthestRank === null) {
    return {
      shouldPromote: false,
      canPromote: false,
      isDeferred: false,
      reason: 'E_NONEXISTENT_TARGET',
    };
  }

  // Not at furthest rank yet
  if (toSquare.rank !== furthestRank) {
    return {
      shouldPromote: false,
      canPromote: false,
      isDeferred: false,
    };
  }

  // At furthest rank - immediate promotion
  return {
    shouldPromote: true,
    canPromote: true,
    isDeferred: false,
  };
}

/**
 * Detects pawns that have deferred promotion and whose overhang has been removed
 *
 * This should be called after every attack board movement to check if any
 * deferred promotions need to be forced.
 *
 * Returns an array of pieces that need forced promotion.
 */
export function detectForcedPromotions(
  pieces: Piece[],
  trackStates: TrackStates,
  world: ChessWorld,
  attackBoardStates?: Record<string, { activeInstanceId: string }>
): Array<{ pieceId: string; squareId: string }> {
  const forcedPromotions: Array<{ pieceId: string; squareId: string }> = [];

  for (const piece of pieces) {
    // Only check pawns with deferred promotion
    if (piece.type !== 'pawn') continue;
    if (!piece.promotionState?.isDeferred) continue;

    // Resolve the board ID for this piece
    const boardId = resolveBoardId(piece.level, attackBoardStates);
    const squareId = createSquareId(piece.file, piece.rank, boardId);
    const square = world.squares.get(squareId);

    if (!square) continue;

    // Check if overhang still exists
    const hasOverhang = checkCornerOverhang(piece.file, piece.color, trackStates);

    if (!hasOverhang) {
      // Overhang removed - force promotion
      forcedPromotions.push({
        pieceId: piece.id,
        squareId,
      });
    }
  }

  return forcedPromotions;
}

/**
 * Helper to check if a pawn is on a missing promotion plane
 * This is primarily for UI feedback (showing locked icon, etc.)
 */
export function isOnMissingPromotionPlane(
  piece: Piece,
  trackStates: TrackStates,
  world: ChessWorld,
  attackBoardStates?: Record<string, { activeInstanceId: string }>
): boolean {
  if (piece.type !== 'pawn') return false;

  const fileStr = fileToString(piece.file);

  // Only z/e files have missing promotion planes
  if (fileStr !== 'z' && fileStr !== 'e') return false;

  const furthestRank = getFurthestRank(
    piece.file,
    piece.color,
    trackStates,
    world,
    attackBoardStates
  );

  // If furthest rank is null, the promotion plane is missing
  return furthestRank === null;
}
