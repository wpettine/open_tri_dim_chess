import { PieceState } from '../movement/types';
import { ChessWorld } from '../world/types';

/**
 * Gets all pieces currently on an attack board
 */
export function getPiecesOnBoard(
  boardId: string,
  pieces: PieceState[],
  world: ChessWorld
): PieceState[] {
  return pieces.filter(piece => {
    const square = world.squares.get(piece.squareId);
    return square?.boardId === boardId;
  });
}

/**
 * Counts pieces on an attack board
 */
export function countPiecesOnBoard(
  boardId: string,
  pieces: PieceState[],
  world: ChessWorld
): number {
  return getPiecesOnBoard(boardId, pieces, world).length;
}

/**
 * Checks if a board can move or rotate (≤1 piece)
 */
export function canBoardMove(
  boardId: string,
  pieces: PieceState[],
  world: ChessWorld
): boolean {
  return countPiecesOnBoard(boardId, pieces, world) <= 1;
}

/**
 * Determines who controls a board (hijack mechanic)
 * - Empty board: original owner
 * - 1 piece: that piece's color (hijack!)
 * - 2+ pieces: null (contested, cannot move)
 */
export function getBoardController(
  boardId: string,
  pieces: PieceState[],
  world: ChessWorld,
  originalOwner: 'white' | 'black' | null
): 'white' | 'black' | null {
  const boardPieces = getPiecesOnBoard(boardId, pieces, world);

  if (boardPieces.length === 0) {
    return originalOwner;
  }

  if (boardPieces.length === 1) {
    return boardPieces[0].color;
  }

  // 2+ pieces: contested
  return null;
}

/**
 * Checks if a player controls a board
 */
export function doesPlayerControlBoard(
  boardId: string,
  playerColor: 'white' | 'black',
  pieces: PieceState[],
  world: ChessWorld,
  originalOwner: 'white' | 'black' | null
): boolean {
  const controller = getBoardController(boardId, pieces, world, originalOwner);
  return controller === playerColor;
}
