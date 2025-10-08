import { ChessWorld } from '../world/types';
import { Color } from '../types';
import { MoveContext, MoveValidation, PieceState } from './types';
import { validateRookMove } from './pieces/rook';
import { validateBishopMove } from './pieces/bishop';
import { validateKnightMove } from './pieces/knight';
import { validateQueenMove } from './pieces/queen';
import { validateKingMove } from './pieces/king';
import { validatePawnMove } from './pieces/pawn';

/**
 * Main entry point for move validation.
 * Validates if a piece can legally move from one square to another.
 *
 * @param pieceId - ID of the piece attempting to move
 * @param fromSquareId - Starting square ID
 * @param toSquareId - Destination square ID
 * @param pieces - All pieces currently on the board
 * @param world - The chess world grid
 * @param currentTurn - Current player's turn
 * @returns MoveValidation result
 */
export function isValidMove(
  pieceId: string,
  fromSquareId: string,
  toSquareId: string,
  pieces: PieceState[],
  world: ChessWorld,
  currentTurn: Color
): MoveValidation {
  // Find the piece
  const piece = pieces.find(p => p.id === pieceId);
  if (!piece) {
    return { valid: false, reason: 'Piece not found' };
  }

  // Check if it's the piece's turn
  if (piece.color !== currentTurn) {
    return { valid: false, reason: 'Not your turn' };
  }

  // Get from and to squares
  const fromSquare = world.squares.get(fromSquareId);
  const toSquare = world.squares.get(toSquareId);

  if (!fromSquare || !fromSquare.isValid) {
    return { valid: false, reason: 'Invalid starting square' };
  }

  if (!toSquare || !toSquare.isValid) {
    return { valid: false, reason: 'Invalid destination square' };
  }

  // Verify piece is at fromSquare
  if (piece.squareId !== fromSquareId) {
    return { valid: false, reason: 'Piece is not at the specified starting square' };
  }

  // Cannot move to same square
  if (fromSquareId === toSquareId) {
    return { valid: false, reason: 'Cannot move to the same square' };
  }

  // Build move context
  const context: MoveContext = {
    piece,
    fromSquare,
    toSquare,
    allPieces: pieces,
    world,
    currentTurn
  };

  // Delegate to piece-specific validator
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
      return { valid: false, reason: 'Unknown piece type' };
  }
}

/**
 * Gets all valid moves for a piece.
 * Useful for highlighting possible moves in the UI.
 *
 * @param pieceId - ID of the piece
 * @param pieces - All pieces on the board
 * @param world - The chess world grid
 * @param currentTurn - Current player's turn
 * @returns Array of valid destination square IDs
 */
export function getValidMoves(
  pieceId: string,
  pieces: PieceState[],
  world: ChessWorld,
  currentTurn: Color
): string[] {
  const piece = pieces.find(p => p.id === pieceId);
  if (!piece || piece.color !== currentTurn) {
    return [];
  }

  const validMoves: string[] = [];

  // Try every possible square in the world
  for (const [squareId, square] of world.squares.entries()) {
    if (!square.isValid) continue;

    const result = isValidMove(
      pieceId,
      piece.squareId,
      squareId,
      pieces,
      world,
      currentTurn
    );

    if (result.valid) {
      validMoves.push(squareId);
    }
  }

  return validMoves;
}

// Re-export types for convenience
export * from './types';
export * from './pathValidation';
