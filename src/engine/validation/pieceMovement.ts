import { MoveValidationContext, MoveResult, TrackStates } from './types';
import { isPathClear, isPieceAt, isDestinationBlockedByVerticalShadow, getPathCoordinates } from './pathValidation';
import { ChessWorld } from '../world/types';
import { Piece } from '../../store/gameStore';
import { checkPromotion } from './promotionRules';

function parseLevelFromSquareId(squareId: string): string {
  const match = squareId.match(/^[a-z]\d+(.+)$/);
  return match ? match[1] : '';
}

/**
 * Calculate the square color (light or dark) for a given square.
 * In Raumschach (3D chess), square colors align vertically - the color is determined
 * by (file + rank) % 2, regardless of level. This means a dark square on one level
 * is dark on all levels at the same file and rank position.
 * Returns 0 for one color, 1 for the other.
 */
function getSquareColor(file: number, rank: number): number {
  return (file + rank) % 2;
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
  const { piece, fromSquare, toSquare, allPieces, world, trackStates, attackBoardStates } = context;

  const fileChange = toSquare.file - fromSquare.file;
  const rankChange = toSquare.rank - fromSquare.rank;
  const direction = piece.color === 'white' ? 1 : -1;

  const fromLevel = parseLevelFromSquareId(fromSquare.id);
  const toLevel = parseLevelFromSquareId(toSquare.id);

  // Check if moving between different attack board instances
  // Attack boards on different tracks (QL vs KL) are disconnected
  if (fromLevel !== toLevel) {
    const isFromAttackBoard = fromLevel.includes(':');
    const isToAttackBoard = toLevel.includes(':');

    // Block only if BOTH are attack boards on DIFFERENT tracks
    if (isFromAttackBoard && isToAttackBoard) {
      const fromTrack = fromLevel.startsWith('QL') ? 'QL' : 'KL';
      const toTrack = toLevel.startsWith('QL') ? 'QL' : 'KL';

      if (fromTrack !== toTrack) {
        return { valid: false, reason: 'cannot move between QL and KL tracks' };
      }

      // Same track - check if moving between different pins on z/e files
      const fromPinMatch = fromLevel.match(/^(?:QL|KL)([1-6])/);
      const toPinMatch = toLevel.match(/^(?:QL|KL)([1-6])/);

      if (fromPinMatch && toPinMatch) {
        const fromPin = parseInt(fromPinMatch[1]);
        const toPin = parseInt(toPinMatch[1]);

        if (fromPin !== toPin && (fromSquare.file === 0 || fromSquare.file === 5)) {
          return { valid: false, reason: 'z and e files have no main board connectivity between attack boards' };
        }
      }
    }
  }

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

  // Diagonal capture
  if (Math.abs(fileChange) === 1 && rankChange === direction && enemyAtDestination) {
    // Check for promotion after valid move
    if (trackStates) {
      const promotionCheck = checkPromotion(piece, toSquare, trackStates, world, attackBoardStates);

      // Block move if promotion square doesn't exist
      if (promotionCheck.reason === 'E_NONEXISTENT_TARGET') {
        return { valid: false, reason: 'Cannot move: promotion square does not exist' };
      }

      return {
        valid: true,
        promotion: promotionCheck.shouldPromote ? {
          shouldPromote: promotionCheck.shouldPromote,
          canPromote: promotionCheck.canPromote,
          isDeferred: promotionCheck.isDeferred,
          overhangBoardId: promotionCheck.overhangBoardId,
        } : undefined
      };
    }
    return { valid: true };
  }

  // Forward move (one square)
  if (fileChange === 0 && rankChange === direction && !destinationBlocked) {
    // Check for promotion after valid move
    if (trackStates) {
      const promotionCheck = checkPromotion(piece, toSquare, trackStates, world, attackBoardStates);

      // Block move if promotion square doesn't exist
      if (promotionCheck.reason === 'E_NONEXISTENT_TARGET') {
        return { valid: false, reason: 'Cannot move: promotion square does not exist' };
      }

      return {
        valid: true,
        promotion: promotionCheck.shouldPromote ? {
          shouldPromote: promotionCheck.shouldPromote,
          canPromote: promotionCheck.canPromote,
          isDeferred: promotionCheck.isDeferred,
          overhangBoardId: promotionCheck.overhangBoardId,
        } : undefined
      };
    }
    return { valid: true };
  }

  // Double-step initial move
  if (fileChange === 0 && rankChange === 2 * direction && !piece.hasMoved && !piece.movedByAB && !destinationBlocked) {
    const intermediateRank = fromSquare.rank + direction;

    const intermediateBlocked = isCoordinateBlockedByAnyLevel(
      fromSquare.file,
      intermediateRank,
      world,
      allPieces
    );

    if (!intermediateBlocked) {
      // Double-step moves never result in promotion
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

  // Check if moving between different attack board instances
  // Attack boards on different tracks (QL vs KL) are disconnected
  // (The only exception is castling, which is handled separately)
  // Attack boards to main boards, and attack boards on the same track, are allowed
  if (levelChange) {
    // For attack boards, the level is the instance ID (e.g., "QL1:0", "KL6:90")
    // Main boards are "W", "N", "B" and are always connected
    const isFromAttackBoard = fromLevel.includes(':');
    const isToAttackBoard = toLevel.includes(':');

    // Block if BOTH are attack boards on DIFFERENT tracks
    if (isFromAttackBoard && isToAttackBoard) {
      const fromTrack = fromLevel.startsWith('QL') ? 'QL' : 'KL';
      const toTrack = toLevel.startsWith('QL') ? 'QL' : 'KL';

      console.log(`[validateRookMove] Attack board to attack board: ${fromSquare.id} -> ${toSquare.id}`);
      console.log(`[validateRookMove] fromTrack=${fromTrack}, toTrack=${toTrack}`);

      if (fromTrack !== toTrack) {
        console.log(`[validateRookMove] BLOCKED: Different tracks`);
        return { valid: false, reason: 'cannot move between QL and KL tracks' };
      }

      // Even on the same track, if the instances are different, they must be connected through main boards
      // Extract pin numbers from instance IDs (e.g., "QL1:0" -> pin 1, "QL6:0" -> pin 6)
      const fromPinMatch = fromLevel.match(/^(?:QL|KL)([1-6])/);
      const toPinMatch = toLevel.match(/^(?:QL|KL)([1-6])/);

      if (fromPinMatch && toPinMatch) {
        const fromPin = parseInt(fromPinMatch[1]);
        const toPin = parseInt(toPinMatch[1]);

        console.log(`[validateRookMove] Pin check: fromPin=${fromPin}, toPin=${toPin}`);

        // If moving between different pins on the same track, path must go through main boards
        if (fromPin !== toPin) {
          // Z-file (0) and E-file (5) only exist on attack boards, not main boards
          // So moves along these files between different pins are illegal (no main board connectivity)
          if (fromSquare.file === 0 || fromSquare.file === 5) {
            console.log(`[validateRookMove] BLOCKED: Cannot move along z/e file between different pins (${fromPin} -> ${toPin})`);
            return { valid: false, reason: 'z and e files have no main board connectivity between attack boards' };
          }

          const pathCoords = getPathCoordinates(fromSquare, toSquare);
          console.log(`[validateRookMove] Different pins detected. Path coordinates: ${pathCoords.length}`);

          if (pathCoords.length === 0) {
            console.log(`[validateRookMove] BLOCKED: Different pins (${fromPin} -> ${toPin}) with no intermediate path`);
            console.log(`[validateRookMove] Details: ${fromSquare.id} (pin ${fromPin}) -> ${toSquare.id} (pin ${toPin})`);
            return { valid: false, reason: 'attack boards at different pins not adjacent' };
          }

          console.log(`[validateRookMove] Different pins but has intermediate path, will check if path is clear`);
        }
      }

      console.log(`[validateRookMove] ALLOWED: Same track connection`);
    }
  }

  const movesOnOneAxis =
    (fileChange !== 0 && rankChange === 0) ||
    (fileChange === 0 && rankChange !== 0);

  if (!movesOnOneAxis) {
    console.log(`[validateRookMove] BLOCKED: Not moving on one axis (fileChange=${fileChange}, rankChange=${rankChange})`);
    return { valid: false, reason: 'rook must move in straight line' };
  }

  if (!isPathClear(fromSquare, toSquare, world, allPieces)) {
    console.log(`[validateRookMove] BLOCKED: Path not clear`);
    return { valid: false, reason: 'path blocked by vertical shadow' };
  }

  if (isDestinationBlockedByVerticalShadow(toSquare, world, allPieces)) {
    console.log(`[validateRookMove] BLOCKED: Destination blocked by vertical shadow`);
    return { valid: false, reason: 'destination blocked by vertical shadow' };
  }

  console.log(`[validateRookMove] VALID: ${fromSquare.id} -> ${toSquare.id}`);
  return { valid: true };
}

export function validateKnightMove(context: MoveValidationContext): MoveResult {
  const { fromSquare, toSquare } = context;

  const fileChange = Math.abs(toSquare.file - fromSquare.file);
  const rankChange = Math.abs(toSquare.rank - fromSquare.rank);

  const fromLevel = parseLevelFromSquareId(fromSquare.id);
  const toLevel = parseLevelFromSquareId(toSquare.id);

  // Check if moving between different attack board instances
  // Attack boards on different tracks (QL vs KL) are disconnected
  if (fromLevel !== toLevel) {
    const isFromAttackBoard = fromLevel.includes(':');
    const isToAttackBoard = toLevel.includes(':');

    // Block only if BOTH are attack boards on DIFFERENT tracks
    if (isFromAttackBoard && isToAttackBoard) {
      const fromTrack = fromLevel.startsWith('QL') ? 'QL' : 'KL';
      const toTrack = toLevel.startsWith('QL') ? 'QL' : 'KL';

      if (fromTrack !== toTrack) {
        return { valid: false, reason: 'cannot move between QL and KL tracks' };
      }

      // Same track - check if moving between different pins on z/e files
      const fromPinMatch = fromLevel.match(/^(?:QL|KL)([1-6])/);
      const toPinMatch = toLevel.match(/^(?:QL|KL)([1-6])/);

      if (fromPinMatch && toPinMatch) {
        const fromPin = parseInt(fromPinMatch[1]);
        const toPin = parseInt(toPinMatch[1]);

        if (fromPin !== toPin && (fromSquare.file === 0 || fromSquare.file === 5)) {
          return { valid: false, reason: 'z and e files have no main board connectivity between attack boards' };
        }
      }
    }
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

  const levelChange = Math.abs(
    (levelMap[toLevel] || 0) - (levelMap[fromLevel] || 0)
  );

  const validLShape =
    (fileChange === 2 && rankChange === 1 && levelChange === 0) ||
    (fileChange === 1 && rankChange === 2 && levelChange === 0) ||
    (fileChange === 2 && levelChange === 1 && rankChange === 0) ||
    (fileChange === 1 && levelChange === 2 && rankChange === 0) ||
    (rankChange === 2 && levelChange === 1 && fileChange === 0) ||
    (rankChange === 1 && levelChange === 2 && fileChange === 0) ||
    (fileChange === 2 && rankChange === 1 && levelChange === 1) ||
    (fileChange === 1 && rankChange === 2 && levelChange === 1) ||
    (fileChange === 2 && rankChange === 0 && levelChange === 1) ||
    (fileChange === 0 && rankChange === 2 && levelChange === 1) ||
    (fileChange === 1 && rankChange === 0 && levelChange === 2) ||
    (rankChange === 1 && fileChange === 0 && levelChange === 2);

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

  // Check if moving between different attack board instances
  // Attack boards on different tracks (QL vs KL) are disconnected
  if (levelChange) {
    const isFromAttackBoard = fromLevel.includes(':');
    const isToAttackBoard = toLevel.includes(':');

    // Block only if BOTH are attack boards on DIFFERENT tracks
    if (isFromAttackBoard && isToAttackBoard) {
      const fromTrack = fromLevel.startsWith('QL') ? 'QL' : 'KL';
      const toTrack = toLevel.startsWith('QL') ? 'QL' : 'KL';

      if (fromTrack !== toTrack) {
        return { valid: false, reason: 'cannot move between QL and KL tracks' };
      }

      // Same track - check if moving between different pins on z/e files
      const fromPinMatch = fromLevel.match(/^(?:QL|KL)([1-6])/);
      const toPinMatch = toLevel.match(/^(?:QL|KL)([1-6])/);

      if (fromPinMatch && toPinMatch) {
        const fromPin = parseInt(fromPinMatch[1]);
        const toPin = parseInt(toPinMatch[1]);

        if (fromPin !== toPin) {
          // Z-file (0) and E-file (5) only exist on attack boards, not main boards
          if (fromSquare.file === 0 || fromSquare.file === 5) {
            return { valid: false, reason: 'z and e files have no main board connectivity between attack boards' };
          }
        }
      }
    }
  }

  // In 3D chess, bishops move diagonally: same distance in exactly 2 of 3 dimensions
  // Calculate level difference for 3D diagonal validation
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

  // Valid 3D diagonal: change same amount in exactly 2 of 3 dimensions
  const validDiagonal =
    (fileChange === rankChange && fileChange > 0) ||           // file-rank diagonal
    (fileChange === levelDiff && fileChange > 0 && rankChange === 0) || // file-level diagonal
    (rankChange === levelDiff && rankChange > 0 && fileChange === 0);   // rank-level diagonal

  if (!validDiagonal) {
    return { valid: false, reason: 'bishop must move diagonally (same distance in exactly 2 dimensions)' };
  }

  // CRITICAL: Bishops must stay on the same color squares
  // In Raumschach, color is based on (file + rank) only, not level
  // Colors align vertically, so a dark square on W is also dark on N and B
  const fromColor = getSquareColor(fromSquare.file, fromSquare.rank);
  const toColor = getSquareColor(toSquare.file, toSquare.rank);

  if (fromColor !== toColor) {
    return { valid: false, reason: 'bishop must stay on same color squares' };
  }

  if (!isPathClear(fromSquare, toSquare, world, allPieces)) {
    return { valid: false, reason: 'path blocked by vertical shadow' };
  }

  if (isDestinationBlockedByVerticalShadow(toSquare, world, allPieces)) {
    return { valid: false, reason: 'destination blocked by vertical shadow' };
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

  // Check if moving between different attack board instances
  if (levelChange) {
    const isFromAttackBoard = fromLevel.includes(':');
    const isToAttackBoard = toLevel.includes(':');

    if (isFromAttackBoard || isToAttackBoard) {
      return { valid: false, reason: 'cannot move between disconnected attack boards' };
    }
  }

  const maxDistance = Math.max(fileChange, rankChange);

  if (maxDistance > 1) {
    return { valid: false, reason: 'king can only move one square' };
  }

  return { valid: true };
}
