import { Piece, AttackBoardStates } from '../../store/gameStore';
import { ChessWorld } from '../world/types';
import { createSquareId } from '../world/coordinates';
import { MoveValidationContext, MoveResult, TrackStates } from './types';
import {
  validatePawnMove,
  validateRookMove,
  validateKnightMove,
  validateBishopMove,
  validateQueenMove,
  validateKingMove,
} from './pieceMovement';
import { resolveBoardId } from '../../utils/resolveBoardId';

export function getLegalMoves(
  piece: Piece,
  world: ChessWorld,
  allPieces: Piece[],
  attackBoardStates?: AttackBoardStates,
  trackStates?: TrackStates
): string[] {
  const legalMoves: string[] = [];

  const resolvedLevel = resolveBoardId(piece.level, attackBoardStates);
  const fromSquareId = createSquareId(piece.file, piece.rank, resolvedLevel);
  const fromSquare = world.squares.get(fromSquareId);

  console.log(`[getLegalMoves] =======================================`);
  console.log(`[getLegalMoves] Starting move generation for ${piece.type} at ${fromSquareId}`);
  console.log(`[getLegalMoves] Piece details:`, { type: piece.type, color: piece.color, file: piece.file, rank: piece.rank, level: piece.level });
  console.log(`[getLegalMoves] Total squares in world:`, world.squares.size);

  // Count QL6 squares
  let ql6Count = 0;
  for (const [squareId] of world.squares) {
    if (squareId.includes('QL6')) ql6Count++;
  }
  console.log(`[getLegalMoves] QL6 squares available:`, ql6Count);

  if (!fromSquare) {
    return legalMoves;
  }

  for (const [squareId, square] of world.squares) {
    if (squareId.includes('QL6')) {
      console.log(`[getLegalMoves] Considering QL6 square: ${squareId}`);
    }

    const context: MoveValidationContext = {
      piece,
      fromSquare,
      toSquare: square,
      world,
      allPieces,
      trackStates,
      attackBoardStates,
    };

    const result = validateMoveForPiece(context, attackBoardStates);
    if (result.valid) {
      legalMoves.push(squareId);
    }
  }

  console.log(`[getLegalMoves] Found ${legalMoves.length} legal moves`);
  return legalMoves;
}

function parseLevelFromSquareId(squareId: string): string {
  const match = squareId.match(/^[a-z]\d+(.+)$/);
  return match ? match[1] : '';
}

function validateMoveForPiece(
  context: MoveValidationContext,
  attackBoardStates?: AttackBoardStates
): MoveResult {
  const { piece, fromSquare, toSquare, allPieces } = context;

  if (toSquare.id.includes('QL6')) {
    console.log(`[validateMoveForPiece] Validating move to QL6: ${fromSquare.id} → ${toSquare.id}`);
  }

  if (fromSquare.id === toSquare.id) {
    return { valid: false, reason: 'cannot move to same square' };
  }

  const toLevel = parseLevelFromSquareId(toSquare.id);
  const targetOccupant = allPieces.find((p) => {
    const resolvedPieceLevel = resolveBoardId(p.level, attackBoardStates);
    return (
      p.file === toSquare.file &&
      p.rank === toSquare.rank &&
      resolvedPieceLevel === toLevel
    );
  });

  if (targetOccupant && targetOccupant.color === piece.color) {
    if (toSquare.id.includes('QL6')) {
      console.log(`[validateMoveForPiece] QL6 square blocked: occupied by own piece`);
    }
    return { valid: false, reason: 'occupied by own piece' };
  }

  if (toSquare.id.includes('QL6')) {
    console.log(`[validateMoveForPiece] QL6 square passed initial checks, calling validate${piece.type}Move`);
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
