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
 * Rules:
 * - Files b, c: Fixed at rank 1 (White) / 8 (Black)
 * - Files z, e: Rank 0/9 if promotion plane exists, null otherwise
 * - Files a, d: Dynamic - 0/9 with overhang, 1/8 without overhang
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
    return color === 'white' ? 1 : 8;
  }

  // Files z, e: outer edge (if exists)
  if (fileStr === 'z' || fileStr === 'e') {
    const promotionRank = color === 'white' ? 0 : 9;
    return promotionSquareExists(file, promotionRank, color, trackStates, world, attackBoardStates)
      ? promotionRank
      : null;
  }

  // Files a, d: dynamic based on overhang
  if (fileStr === 'a' || fileStr === 'd') {
    const hasOverhang = checkCornerOverhang(file, color, trackStates);

    if (hasOverhang) {
      // With overhang: promotion at rank 0/9
      const promotionRank = color === 'white' ? 0 : 9;
      return promotionSquareExists(file, promotionRank, color, trackStates, world, attackBoardStates)
        ? promotionRank
        : null;
    } else {
      // Without overhang: promotion at rank 1/8
      return color === 'white' ? 1 : 8;
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

  // For z/e files, check if attack board is at the required pin
  if (fileStr === 'z' || fileStr === 'e') {
    const track = fileStr === 'z' ? 'QL' : 'KL';
    const playerKey = color === 'white' ? 'whiteBoardPin' : 'blackBoardPin';
    const playerPin = trackStates[track][playerKey];
    const requiredPin = color === 'white' ? 1 : 6;

    if (playerPin !== requiredPin) {
      return false; // Board not at outer edge
    }
  }

  // For a/d files at rank 0/9, also check attack board position
  if ((fileStr === 'a' || fileStr === 'd') && (rank === 0 || rank === 9)) {
    const track = fileStr === 'a' ? 'QL' : 'KL';
    const playerKey = color === 'white' ? 'whiteBoardPin' : 'blackBoardPin';
    const playerPin = trackStates[track][playerKey];
    const requiredPin = color === 'white' ? 1 : 6;

    if (playerPin !== requiredPin) {
      return false; // Board not at outer edge
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
  if (fileStr === 'z' || fileStr === 'a') {
    // Queen's Line track
    const boardKey = color === 'white' ? 'WQL' : 'BQL';
    if (attackBoardStates?.[boardKey]) {
      return attackBoardStates[boardKey].activeInstanceId;
    }
    // Fallback: calculate instance ID from trackStates
    const pin = color === 'white' ? trackStates.QL.whiteBoardPin : trackStates.QL.blackBoardPin;
    const rotation = color === 'white' ? trackStates.QL.whiteRotation : trackStates.QL.blackRotation;
    return `QL${pin}:${rotation}`;
  }

  if (fileStr === 'd' || fileStr === 'e') {
    // King's Line track
    const boardKey = color === 'white' ? 'WKL' : 'BKL';
    if (attackBoardStates?.[boardKey]) {
      return attackBoardStates[boardKey].activeInstanceId;
    }
    // Fallback: calculate instance ID from trackStates
    const pin = color === 'white' ? trackStates.KL.whiteBoardPin : trackStates.KL.blackBoardPin;
    const rotation = color === 'white' ? trackStates.KL.whiteRotation : trackStates.KL.blackRotation;
    return `KL${pin}:${rotation}`;
  }

  return 'W'; // Default fallback
}

/**
 * Checks if there is an opponent attack board overhang at a corner
 *
 * Corners are:
 * - White: a8B, d8B (rank 8 on Black main board, files a/d)
 * - Black: a1W, d1W (rank 1 on White main board, files a/d)
 *
 * Overhang occurs when the opponent's attack board is at pin 6 (for White corners)
 * or pin 1 (for Black corners) on the same track (QL for file a, KL for file d)
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

  // Check if opponent's board is at the corner pin
  // For White (promoting at rank 8), check if Black board at pin 6
  // For Black (promoting at rank 1), check if White board at pin 1
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

  // Special case: Check for deferred promotion at opponent's corner FIRST
  // This is separate from the normal furthest rank logic
  const fileStr = fileToString(toSquare.file);
  const isCornerFile = fileStr === 'a' || fileStr === 'd';

  // Deferred promotion squares:
  // - White: a8B, d8B (rank 8 on Black's main board)
  // - Black: a1W, d1W (rank 1 on White's main board)
  // Note: Main board IDs in WorldSquare are 'WL', 'NL', 'BL' (not 'W', 'N', 'B')
  const isDeferredCorner = isCornerFile && (
    (piece.color === 'white' && toSquare.rank === 8 && toSquare.boardId === 'BL') ||
    (piece.color === 'black' && toSquare.rank === 1 && toSquare.boardId === 'WL')
  );

  if (isDeferredCorner) {
    const hasOverhang = checkCornerOverhang(toSquare.file, piece.color, trackStates);

    if (hasOverhang) {
      // Deferred promotion case - opponent's board is overhead
      const track = fileStr === 'a' ? 'QL' : 'KL';
      const opponentColor = piece.color === 'white' ? 'black' : 'white';
      const boardId = opponentColor === 'white'
        ? (track === 'QL' ? 'WQL' : 'WKL')
        : (track === 'QL' ? 'BQL' : 'BKL');

      return {
        shouldPromote: true,
        canPromote: false,
        isDeferred: true,
        overhangBoardId: boardId,
      };
    }
    // If at corner but no overhang, fall through to normal promotion check
  }

  // Normal promotion logic: check if at furthest rank
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

  // Normal promotion - pawn reached its furthest rank
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
