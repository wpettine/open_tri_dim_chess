import { MoveContext, MoveValidation } from '../types';
import { validateRookMove } from './rook';
import { validateBishopMove } from './bishop';

/**
 * Validates Queen movement according to Meder's rules.
 *
 * Rules:
 * - Combines Rook and Bishop movement
 * - Can move along ranks, files, or diagonals
 * - Can cross between boards/levels
 * - Path must be clear (subject to Vertical Shadow rule)
 * - Cannot make purely vertical moves (same file+rank, different level)
 *
 * Reference: Section 3.3 of move_logic_tests.md
 */
export function validateQueenMove(context: MoveContext): MoveValidation {
  // Queen can move like a Rook OR like a Bishop
  const rookResult = validateRookMove(context);
  if (rookResult.valid) {
    return rookResult;
  }

  const bishopResult = validateBishopMove(context);
  if (bishopResult.valid) {
    return bishopResult;
  }

  // Neither Rook nor Bishop movement was valid
  return {
    valid: false,
    reason: 'Queens can only move along ranks, files, or diagonals'
  };
}
