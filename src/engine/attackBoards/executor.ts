import { BoardMoveContext, BoardMoveResult, BoardRotation, Quadrant } from './types';
import { validateBoardMove, validateBoardRotation } from './validator';
import { getPiecesOnBoard } from './occupancy';
import { PieceState } from '../movement/types';

/**
 * Rotation map for 180° rotation (§ 3.4)
 * q1 ↔ q3, q2 ↔ q4
 */
const ROTATE_180: Record<Quadrant, Quadrant> = {
  q1: 'q3',
  q2: 'q4',
  q3: 'q1',
  q4: 'q2',
};

/**
 * Executes an attack board move with optional rotation
 */
export function executeBoardMove(context: BoardMoveContext): BoardMoveResult {
  const { boardId, fromPinId, toPinId, rotation, pieces, world } = context;

  // Validate move
  const validation = validateBoardMove(context);
  if (!validation.valid) {
    return { success: false, reason: validation.reason };
  }

  // Get pieces on the board (passengers)
  const passengerPieces = getPiecesOnBoard(boardId, pieces, world);

  // Calculate new square IDs for passenger pieces
  const updatedPieces = pieces.map(piece => {
    const isPassenger = passengerPieces.some(p => p.id === piece.id);
    if (!isPassenger) {
      return piece; // Not on this board, no change
    }

    // Get current square info
    const currentSquare = world.squares.get(piece.squareId);
    if (!currentSquare) {
      return piece; // Safety check
    }

    // Extract quadrant from current square
    const quadrant = getQuadrantFromSquare(currentSquare.id, fromPinId, world);
    if (!quadrant) {
      return piece; // Not on attack board, shouldn't happen
    }

    // Apply rotation if specified
    const newQuadrant = rotation === 180 ? ROTATE_180[quadrant] : quadrant;

    // Calculate new square ID at destination pin
    const newSquareId = calculateSquareIdAtPin(toPinId, newQuadrant, world);
    if (!newSquareId) {
      return piece; // Safety check
    }

    // Return updated piece with new square and passenger flag
    return {
      ...piece,
      squareId: newSquareId,
      movedAsPassenger: true, // Mark as transported (important for pawn 2-step rule)
    };
  });

  return {
    success: true,
    updatedPieces,
    newBoardPosition: {
      pinId: toPinId,
      rotation: rotation || 0,
    },
  };
}

/**
 * Executes board rotation without movement
 */
export function executeBoardRotation(
  boardId: string,
  rotation: BoardRotation,
  pieces: PieceState[],
  world: any
): BoardMoveResult {
  // Validate rotation
  const validation = validateBoardRotation(boardId, pieces, world);
  if (!validation.valid) {
    return { success: false, reason: validation.reason };
  }

  if (rotation !== 180) {
    return { success: false, reason: 'Only 180° rotation is allowed' };
  }

  // Get board's current pin
  const board = world.boards.get(boardId);
  if (!board) {
    return { success: false, reason: 'Board not found' };
  }

  const currentPinId = getBoardPinId(boardId, world);
  if (!currentPinId) {
    return { success: false, reason: 'Could not determine board pin' };
  }

  // Get passenger pieces
  const passengerPieces = getPiecesOnBoard(boardId, pieces, world);

  // Rotate passenger pieces
  const updatedPieces = pieces.map(piece => {
    const isPassenger = passengerPieces.some(p => p.id === piece.id);
    if (!isPassenger) {
      return piece;
    }

    const currentSquare = world.squares.get(piece.squareId);
    if (!currentSquare) {
      return piece;
    }

    const quadrant = getQuadrantFromSquare(currentSquare.id, currentPinId, world);
    if (!quadrant) {
      return piece;
    }

    const newQuadrant = ROTATE_180[quadrant];
    const newSquareId = calculateSquareIdAtPin(currentPinId, newQuadrant, world);
    if (!newSquareId) {
      return piece;
    }

    return {
      ...piece,
      squareId: newSquareId,
    };
  });

  return {
    success: true,
    updatedPieces,
    newBoardPosition: {
      pinId: currentPinId,
      rotation: rotation,
    },
  };
}

/**
 * Determines which quadrant a square belongs to on an attack board
 */
function getQuadrantFromSquare(
  squareId: string,
  pinId: string,
  world: any
): Quadrant | null {
  const square = world.squares.get(squareId);
  const pin = world.pins.get(pinId);
  if (!square || !pin) return null;

  // Calculate relative position within the 2x2 board
  const relFile = square.file - pin.fileOffset;
  const relRank = square.rank - pin.rankOffset;

  // Map to quadrants:
  // q1: (0,0), q2: (1,0), q3: (0,1), q4: (1,1)
  if (relFile === 0 && relRank === 0) return 'q1';
  if (relFile === 1 && relRank === 0) return 'q2';
  if (relFile === 0 && relRank === 1) return 'q3';
  if (relFile === 1 && relRank === 1) return 'q4';

  return null;
}

/**
 * Calculates square ID for a quadrant at a specific pin
 */
function calculateSquareIdAtPin(
  pinId: string,
  quadrant: Quadrant,
  world: any
): string | null {
  const pin = world.pins.get(pinId);
  if (!pin) return null;

  // Map quadrant to relative file/rank
  const quadrantMap: Record<Quadrant, { file: number; rank: number }> = {
    q1: { file: 0, rank: 0 },
    q2: { file: 1, rank: 0 },
    q3: { file: 0, rank: 1 },
    q4: { file: 1, rank: 1 },
  };

  const offset = quadrantMap[quadrant];
  const targetFile = pin.fileOffset + offset.file;
  const targetRank = pin.rankOffset + offset.rank;

  // Find square at this position on the attack board
  for (const [squareId, square] of world.squares) {
    if (
      square.boardId === getBoardIdAtPin(pinId) &&
      square.file === targetFile &&
      square.rank === targetRank
    ) {
      return squareId;
    }
  }

  return null;
}

/**
 * Gets the board ID for a given pin (helper function)
 */
function getBoardIdAtPin(pinId: string): string {
  // Map pins to boards (simplified - this should come from world state)
  if (pinId.startsWith('QL')) return 'WQL'; // Placeholder
  if (pinId.startsWith('KL')) return 'WKL'; // Placeholder
  return '';
}

/**
 * Gets current pin ID for a board (helper function)
 */
function getBoardPinId(boardId: string, world: any): string | null {
  // This should be stored in world state
  // For now, return null (will be implemented in game store integration)
  return null;
}
