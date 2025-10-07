import { Piece } from '../../store/gameStore';
import { ChessWorld } from '../world/types';
import { createSquareId } from '../world/coordinates';
import { MoveValidationContext, MoveResult } from './types';
import {
  validatePawnMove,
  validateRookMove,
  validateKnightMove,
  validateBishopMove,
  validateQueenMove,
  validateKingMove,
} from './pieceMovement';

export function getLegalMoves(
  piece: Piece,
  world: ChessWorld,
  allPieces: Piece[]
): string[] {
  const legalMoves: string[] = [];

  const fromSquareId = createSquareId(piece.file, piece.rank, piece.level);
  const fromSquare = world.squares.get(fromSquareId);

  if (!fromSquare) {
    return legalMoves;
  }

  for (const [squareId, square] of world.squares) {
    const context: MoveValidationContext = {
      piece,
      fromSquare,
      toSquare: square,
      world,
      allPieces,
    };

    const result = validateMoveForPiece(context);
    if (result.valid) {
      legalMoves.push(squareId);
    }
  }

  return legalMoves;
}

function parseLevelFromSquareId(squareId: string): string {
  const match = squareId.match(/^[a-z]\d+(.+)$/);
  return match ? match[1] : '';
}

function validateMoveForPiece(context: MoveValidationContext): MoveResult {
  const { piece, fromSquare, toSquare, allPieces } = context;

  if (fromSquare.id === toSquare.id) {
    return { valid: false, reason: 'cannot move to same square' };
  }

  const toLevel = parseLevelFromSquareId(toSquare.id);
  const targetOccupant = allPieces.find(
    (p) =>
      p.file === toSquare.file &&
      p.rank === toSquare.rank &&
      p.level === toLevel
  );

  if (targetOccupant && targetOccupant.color === piece.color) {
    return { valid: false, reason: 'occupied by own piece' };
  }

  switch (piece.type) {
    case 'pawn':
      return validatePawnMove(context);
    case 'rook':
      return validateRookMove(context);
    case 'knight':
      return validateKnightMove(context);
    case 'bishop':
      return validateBishopMove(context);
    case 'queen':
      return validateQueenMove(context);
    case 'king':
      return validateKingMove(context);
    default:
      return { valid: false, reason: 'unknown piece type' };
  }
}
