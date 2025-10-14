import { Piece, AttackBoardStates } from '../../store/gameStore';
import { ChessWorld, WorldSquare } from '../world/types';
import { createSquareId } from '../world/coordinates';
import { getLegalMoves } from './moveValidator';

export function isSquareAttacked(
  square: WorldSquare,
  byColor: 'white' | 'black',
  world: ChessWorld,
  pieces: Piece[],
  attackBoardStates?: AttackBoardStates
): boolean {
  const attackingPieces = pieces.filter((p) => p.color === byColor);

  for (const piece of attackingPieces) {
    const legalMoves = getLegalMoves(piece, world, pieces, attackBoardStates);
    if (legalMoves.includes(square.id)) {
      return true;
    }
  }

  return false;
}

export function isInCheck(
  color: 'white' | 'black',
  world: ChessWorld,
  pieces: Piece[],
  attackBoardStates?: AttackBoardStates
): boolean {
  const king = pieces.find((p) => p.type === 'king' && p.color === color);

  if (!king) {
    return false;
  }

  const kingSquareId = createSquareId(king.file, king.rank, king.level);
  const kingSquare = world.squares.get(kingSquareId);

  if (!kingSquare) {
    return false;
  }

  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(kingSquare, opponentColor, world, pieces, attackBoardStates);
}

export function getLegalMovesAvoidingCheck(
  piece: Piece,
  world: ChessWorld,
  pieces: Piece[],
  attackBoardStates?: AttackBoardStates
): string[] {
  const allMoves = getLegalMoves(piece, world, pieces, attackBoardStates);
  const safeMoves: string[] = [];

  for (const toSquareId of allMoves) {
    const { newPieces } = simulateMove(pieces, piece, toSquareId, world);

    if (!isInCheck(piece.color, world, newPieces, attackBoardStates)) {
      safeMoves.push(toSquareId);
    }
  }

  return safeMoves;
}

function simulateMove(
  pieces: Piece[],
  piece: Piece,
  toSquareId: string,
  world: ChessWorld
): { newPieces: Piece[]; capturedPiece: Piece | null } {
  const toSquare = world.squares.get(toSquareId);
  if (!toSquare) {
    return { newPieces: pieces, capturedPiece: null };
  }

  const toLevelMatch = toSquareId.match(/^[a-z]\d+(.+)$/);
  const toLevel = toLevelMatch ? toLevelMatch[1] : piece.level;

  const capturedPiece = pieces.find(
    (p) =>
      p.file === toSquare.file &&
      p.rank === toSquare.rank &&
      p.level === toLevel &&
      p.id !== piece.id
  ) || null;

  const newPieces = pieces
    .filter((p) => p.id !== capturedPiece?.id)
    .map((p) => {
      if (p.id === piece.id) {
        return {
          ...p,
          file: toSquare.file,
          rank: toSquare.rank,
          level: toLevel,
          hasMoved: true,
        };
      }
      return p;
    });

  return { newPieces, capturedPiece };
}

export function isCheckmate(
  color: 'white' | 'black',
  world: ChessWorld,
  pieces: Piece[],
  attackBoardStates?: AttackBoardStates
): boolean {
  if (!isInCheck(color, world, pieces, attackBoardStates)) {
    return false;
  }

  const playerPieces = pieces.filter((p) => p.color === color);

  for (const piece of playerPieces) {
    const safeMoves = getLegalMovesAvoidingCheck(piece, world, pieces, attackBoardStates);
    if (safeMoves.length > 0) {
      return false;
    }
  }

  return true;
}

export function isStalemate(
  color: 'white' | 'black',
  world: ChessWorld,
  pieces: Piece[],
  attackBoardStates?: AttackBoardStates
): boolean {
  if (isInCheck(color, world, pieces, attackBoardStates)) {
    return false;
  }

  const playerPieces = pieces.filter((p) => p.color === color);

  for (const piece of playerPieces) {
    const safeMoves = getLegalMovesAvoidingCheck(piece, world, pieces, attackBoardStates);
    if (safeMoves.length > 0) {
      return false;
    }
  }

  return true;
}
