import { BoardMoveContext, BoardMoveValidation } from './types';
import { canBoardMove, doesPlayerControlBoard, getPiecesOnBoard } from './occupancy';
import { arePinsAdjacent, getBoardMoveDirection, isDirectionAllowedForEmpty, isDirectionAllowedForOccupied } from './adjacency';
import { isBlockedByVerticalShadow } from './verticalShadow';

/**
 * Validates attack board movement according to ATTACK_BOARD_RULES.md § 3
 *
 * Rules enforced:
 * 1. Adjacency (§ 3.1): Boards can only move to adjacent pins
 * 2. Occupancy (§ 3.2): Board must have ≤1 piece to move
 * 3. Directional limits (§ 3.3): Occupied can't go backward; empty can
 * 4. Vertical Shadow (§ 4): Can't place board over non-knight pieces
 * 5. Control: Only current player can move boards they control
 * 6. King Safety (§ 3.5): Move can't leave/create check (TODO: Phase 8 Check/Checkmate)
 */
export function validateBoardMove(context: BoardMoveContext): BoardMoveValidation {
  const { boardId, fromPinId, toPinId, pieces, world, currentTurn } = context;

  // Get board info
  const board = world.boards.get(boardId);
  if (!board) {
    return { valid: false, reason: 'Board not found' };
  }

  // Get original owner from board metadata
  const originalOwner = getOriginalOwner(boardId);

  // Rule 2: Occupancy restriction - max 1 piece (check this first!)
  if (!canBoardMove(boardId, pieces, world)) {
    return { valid: false, reason: 'Board has more than 1 piece (cannot move)' };
  }

  // Rule 5: Control check - player must control the board
  if (!doesPlayerControlBoard(boardId, currentTurn, pieces, world, originalOwner)) {
    return { valid: false, reason: 'You do not control this board' };
  }

  // Rule 1: Adjacency check
  if (!arePinsAdjacent(fromPinId, toPinId)) {
    return { valid: false, reason: 'Target pin is not adjacent to current pin' };
  }

  // Rule 3: Directional limits
  const direction = getBoardMoveDirection(fromPinId, toPinId);
  const boardPieces = getPiecesOnBoard(boardId, pieces, world);
  const isOccupied = boardPieces.length > 0;

  if (isOccupied && !isDirectionAllowedForOccupied(direction)) {
    return { valid: false, reason: 'Occupied boards cannot move backward (inverted)' };
  }

  if (!isOccupied && !isDirectionAllowedForEmpty(direction)) {
    return { valid: false, reason: 'Invalid direction for empty board' };
  }

  // Rule 4: Vertical Shadow constraint
  if (isBlockedByVerticalShadow(toPinId, pieces, world)) {
    return { valid: false, reason: 'Blocked by Vertical Shadow Rule (piece below/above)' };
  }

  // Rule 6: King safety (TODO: implement in Phase 8)
  // For now, we allow all moves that pass other rules

  return { valid: true };
}

/**
 * Gets the original owner of an attack board based on its ID
 */
function getOriginalOwner(boardId: string): 'white' | 'black' | null {
  if (boardId === 'WQL' || boardId === 'WKL') {
    return 'white';
  }
  if (boardId === 'BQL' || boardId === 'BKL') {
    return 'black';
  }
  return null;
}

/**
 * Validates rotation of an attack board
 * Can only rotate if board has ≤1 piece
 */
export function validateBoardRotation(
  boardId: string,
  pieces: any[],
  world: any
): BoardMoveValidation {
  if (!canBoardMove(boardId, pieces, world)) {
    return { valid: false, reason: 'Board has more than 1 piece (cannot rotate)' };
  }

  return { valid: true };
}
