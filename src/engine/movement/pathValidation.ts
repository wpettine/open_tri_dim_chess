import { WorldSquare, ChessWorld } from '../world/types';
import { PieceState, PathStep } from './types';

/**
 * Creates a unique key for a file-rank combination.
 * Used for detecting vertical shadow blocking.
 */
export function createFileRankKey(file: number, rank: number): string {
  return `${file}-${rank}`;
}

/**
 * Gets all occupied file-rank positions from current pieces.
 * These positions create "vertical shadows" that block movement.
 * Excludes the moving piece's current position.
 */
export function getOccupiedColumns(
  pieces: PieceState[],
  world: ChessWorld,
  excludeSquareId?: string
): Set<string> {
  const occupied = new Set<string>();

  for (const piece of pieces) {
    // Skip the moving piece's current position
    if (excludeSquareId && piece.squareId === excludeSquareId) {
      continue;
    }

    const square = world.squares.get(piece.squareId);
    if (square) {
      occupied.add(createFileRankKey(square.file, square.rank));
    }
  }

  return occupied;
}

/**
 * Checks if a piece at the given position blocks a path step.
 * Knights are exempt from vertical shadow blocking.
 */
export function isBlockedByVerticalShadow(
  pathStep: PathStep,
  occupiedColumns: Set<string>,
  isKnightMove: boolean
): boolean {
  // Knights ignore vertical shadows
  if (isKnightMove) {
    return false;
  }

  // Check if this file-rank column is occupied
  return occupiedColumns.has(pathStep.fileRankKey);
}

/**
 * Generates all squares along a straight path between two squares.
 * Does NOT include the start square, but DOES include the end square.
 * Returns null if path is not straight (diagonal, rank, or file).
 */
export function generateStraightPath(
  from: WorldSquare,
  to: WorldSquare,
  world: ChessWorld
): PathStep[] | null {
  const fileDir = Math.sign(to.file - from.file);
  const rankDir = Math.sign(to.rank - from.rank);

  // Must be straight line (same file OR same rank, OR diagonal)
  const isDiagonal = Math.abs(to.file - from.file) === Math.abs(to.rank - from.rank);
  const isFileLine = from.file === to.file;
  const isRankLine = from.rank === to.rank;

  if (!isDiagonal && !isFileLine && !isRankLine) {
    return null;
  }

  const path: PathStep[] = [];
  let currentFile = from.file + fileDir;
  let currentRank = from.rank + rankDir;

  // Walk along the path until we reach the destination
  while (currentFile !== to.file || currentRank !== to.rank) {
    // Find a valid square at this file-rank position
    // It could be on any level in the path
    const possibleSquares = Array.from(world.squares.values()).filter(
      sq => sq.file === currentFile && sq.rank === currentRank && sq.isValid
    );

    // Add all possible squares at this position (multi-level consideration)
    // We'll check each level for obstruction
    for (const sq of possibleSquares) {
      path.push({
        square: sq,
        fileRankKey: createFileRankKey(currentFile, currentRank)
      });
    }

    currentFile += fileDir;
    currentRank += rankDir;
  }

  // Add destination square
  path.push({
    square: to,
    fileRankKey: createFileRankKey(to.file, to.rank)
  });

  return path;
}

/**
 * Checks if a straight path is clear of obstructions.
 * Applies the Vertical Shadow rule: any piece in the file-rank column blocks the path.
 *
 * @param from - Starting square (excluded from check)
 * @param to - Ending square (included in check for captures)
 * @param pieces - All pieces on the board
 * @param movingPieceColor - Color of the piece attempting the move
 * @param world - The chess world
 * @param isKnightMove - If true, ignores vertical shadows
 * @returns True if path is clear (destination may have enemy piece)
 */
export function isPathClear(
  from: WorldSquare,
  to: WorldSquare,
  pieces: PieceState[],
  movingPieceColor: string,
  world: ChessWorld,
  isKnightMove: boolean = false
): boolean {
  const path = generateStraightPath(from, to, world);

  if (!path) {
    return false; // Not a straight path
  }

  // Get occupied columns, excluding the moving piece's starting position
  const occupiedColumns = getOccupiedColumns(pieces, world, from.id);

  // Check each step in the path
  for (let i = 0; i < path.length - 1; i++) { // Exclude destination
    const step = path[i];

    if (isBlockedByVerticalShadow(step, occupiedColumns, isKnightMove)) {
      return false;
    }
  }

  // Check destination square for captures
  const pieceAtDest = pieces.find(p => p.squareId === to.id);

  if (pieceAtDest) {
    // Can capture enemy piece
    return pieceAtDest.color !== movingPieceColor;
  }

  // Check if destination file-rank is occupied on ANY level (vertical shadow)
  // This prevents two pieces from occupying the same file-rank on different levels
  const destOccupied = pieces.some(p => {
    const square = world.squares.get(p.squareId);
    return square &&
           square.file === to.file &&
           square.rank === to.rank &&
           square.boardId !== to.boardId && // Different level
           p.type !== 'knight'; // Knights don't create vertical shadows
  });

  if (destOccupied) {
    return false; // Blocked by vertical shadow at destination
  }

  return true; // Path is clear
}

/**
 * Checks if a move is purely vertical (same file and rank, different level).
 * This type of move is prohibited by the rules.
 */
export function isPurelyVerticalMove(from: WorldSquare, to: WorldSquare): boolean {
  return from.file === to.file && from.rank === to.rank && from.boardId !== to.boardId;
}

/**
 * Gets a piece at a specific square ID.
 */
export function getPieceAtSquare(squareId: string, pieces: PieceState[]): PieceState | undefined {
  return pieces.find(p => p.squareId === squareId);
}

/**
 * Checks if a destination square is blocked by vertical shadow.
 * Returns true if any non-knight piece occupies the same file-rank on a different level.
 */
export function isDestinationBlockedByVerticalShadow(
  toSquare: WorldSquare,
  pieces: PieceState[],
  world: ChessWorld
): boolean {
  return pieces.some(p => {
    const square = world.squares.get(p.squareId);
    return square &&
           square.file === toSquare.file &&
           square.rank === toSquare.rank &&
           square.boardId !== toSquare.boardId && // Different level
           p.type !== 'knight'; // Knights don't create vertical shadows
  });
}

/**
 * Checks if a square is under attack by any enemy piece.
 * Used for check detection and King movement validation.
 */
export function isSquareUnderAttack(
  squareId: string,
  byColor: string,
  pieces: PieceState[],
  world: ChessWorld
): boolean {
  const square = world.squares.get(squareId);
  if (!square) return false;

  // TODO: Check if any enemy piece can attack this square
  // This will be implemented once piece validators are complete
  // For now, return false as a placeholder

  // Suppress unused variable warnings
  void byColor;
  void pieces;
  void world;

  return false;
}
