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

  for (const coord of pathCoordinates) {
    if (isCoordinateBlocked(coord, world, pieces)) {
      return false;
    }
  }

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

  for (const squareId of squareIdsToCheck) {
    if (isPieceAt(squareId, pieces)) {
      return true;
    }
  }

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

  return pieces.some(
    (p) =>
      p.file === square.file &&
      p.rank === square.rank &&
      p.level === square.level
  );
}

function parseSquareIdToPiece(squareId: string): { file: number; rank: number; level: string } | null {
  const fileLetters = ['z', 'a', 'b', 'c', 'd', 'e'];
  const fileLetter = squareId[0];
  const fileIndex = fileLetters.indexOf(fileLetter);
  
  if (fileIndex === -1) return null;

  const match = squareId.match(/^[a-z](\d+)(.+)$/);
  if (!match) return null;

  return {
    file: fileIndex,
    rank: parseInt(match[1], 10),
    level: match[2],
  };
}
