import { ChessWorld, WorldSquare } from '../world/types';
import { Piece } from '../../store/gameStore';
import { PathCoordinate } from './types';

export function isPathClear(
  fromSquare: WorldSquare,
  toSquare: WorldSquare,
  world: ChessWorld,
  pieces: Piece[]
): boolean {
  const pathCoordinates = getPathCoordinates(fromSquare, toSquare);

  console.log(`[isPathClear] Checking path from ${fromSquare.id} to ${toSquare.id}`);
  console.log(`[isPathClear] Path coordinates (${pathCoordinates.length}):`, pathCoordinates);

  for (const coord of pathCoordinates) {
    if (isCoordinateBlocked(coord, world, pieces)) {
      console.log(`[isPathClear] BLOCKED at coordinate (${coord.file}, ${coord.rank})`);
      return false;
    }
  }

  console.log(`[isPathClear] Path is clear`);
  return true;
}

function parseLevelFromSquareId(squareId: string): string {
  const match = squareId.match(/^[a-z]\d+(.+)$/);
  return match ? match[1] : '';
}

export function isDestinationBlockedByVerticalShadow(
  toSquare: WorldSquare,
  world: ChessWorld,
  pieces: Piece[]
): boolean {
  const toLevel = parseLevelFromSquareId(toSquare.id);
  const squareIdsAtCoordinate = getSquareIdsForCoordinate(toSquare.file, toSquare.rank, world);
  
  for (const squareId of squareIdsAtCoordinate) {
    const squareLevel = parseLevelFromSquareId(squareId);
    if (squareLevel !== toLevel && isPieceAt(squareId, pieces)) {
      return true;
    }
  }
  
  return false;
}

export function getPathCoordinates(from: WorldSquare, to: WorldSquare): PathCoordinate[] {
  const path: PathCoordinate[] = [];

  const fileChange = to.file - from.file;
  const rankChange = to.rank - from.rank;

  const steps = Math.max(Math.abs(fileChange), Math.abs(rankChange));
  
  if (steps === 0) {
    return path;
  }

  const fileStep = fileChange === 0 ? 0 : fileChange / Math.abs(fileChange);
  const rankStep = rankChange === 0 ? 0 : rankChange / Math.abs(rankChange);

  for (let i = 1; i < steps; i++) {
    path.push({
      file: from.file + fileStep * i,
      rank: from.rank + rankStep * i,
    });
  }

  return path;
}

function isCoordinateBlocked(
  coord: PathCoordinate,
  world: ChessWorld,
  pieces: Piece[]
): boolean {
  const squareIdsToCheck = getSquareIdsForCoordinate(coord.file, coord.rank, world);

  console.log(`[isCoordinateBlocked] Checking (${coord.file}, ${coord.rank}), found ${squareIdsToCheck.length} squares:`, squareIdsToCheck);

  // If there are no squares at this coordinate in the world, the path doesn't exist
  // This prevents pieces from jumping through gaps (e.g., z file has no main board squares)
  if (squareIdsToCheck.length === 0) {
    console.log(`[isCoordinateBlocked] No squares exist at coordinate (${coord.file}, ${coord.rank}) - path gap detected - BLOCKING MOVE`);
    return true; // Treat missing squares as blocked
  }

  for (const squareId of squareIdsToCheck) {
    if (isPieceAt(squareId, pieces)) {
      console.log(`[isCoordinateBlocked] BLOCKED by piece at ${squareId}`);
      return true;
    }
  }

  console.log(`[isCoordinateBlocked] Coordinate (${coord.file}, ${coord.rank}) is clear`);
  return false;
}

function getSquareIdsForCoordinate(
  file: number,
  rank: number,
  world: ChessWorld
): string[] {
  const squareIds: string[] = [];

  for (const [squareId, square] of world.squares) {
    if (square.file === file && square.rank === rank) {
      squareIds.push(squareId);
    }
  }

  return squareIds;
}

export function isPieceAt(squareId: string, pieces: Piece[]): boolean {
  const square = parseSquareIdToPiece(squareId);
  if (!square) return false;

  const hasPiece = pieces.some(
    (p) =>
      p.file === square.file &&
      p.rank === square.rank &&
      p.level === square.level
  );

  // Debug logging to verify the fix
  if (hasPiece) {
    console.log(`[isPieceAt] Found piece at ${squareId} (converted level: ${square.level})`);
  }

  return hasPiece;
}

/**
 * Converts an instance ID to a board ID for piece comparison
 * Instance IDs: "KL1:0", "QL6:90", etc.
 * Board IDs: "WKL", "BQL", etc.
 */
function instanceIdToBoardId(instanceId: string): string {
  // Main boards don't change
  if (instanceId === 'W' || instanceId === 'N' || instanceId === 'B') {
    return instanceId;
  }

  // Attack boards: extract track and pin to determine color
  // Format: QL1:0, KL6:90, etc.
  const match = instanceId.match(/^(QL|KL)([1-6])/);
  if (!match) return instanceId;

  const track = match[1]; // "QL" or "KL"
  const pin = parseInt(match[2], 10); // 1-6

  // Pins 1-3 are white, 4-6 are black
  // But more specifically: pin 1 is white's starting position, pin 6 is black's
  const color = pin <= 3 ? 'W' : 'B';

  const boardId = `${color}${track}`;
  console.log(`[instanceIdToBoardId] ${instanceId} → ${boardId}`);

  return boardId;
}

function parseSquareIdToPiece(squareId: string): { file: number; rank: number; level: string } | null {
  const fileLetters = ['z', 'a', 'b', 'c', 'd', 'e'];
  const fileLetter = squareId[0];
  const fileIndex = fileLetters.indexOf(fileLetter);

  if (fileIndex === -1) return null;

  const match = squareId.match(/^[a-z](\d+)(.+)$/);
  if (!match) return null;

  const instanceId = match[2];
  const boardId = instanceIdToBoardId(instanceId);

  return {
    file: fileIndex,
    rank: parseInt(match[1], 10),
    level: boardId, // Now returns board ID (WKL) instead of instance ID (KL1:0)
  };
}
