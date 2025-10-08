import { BoardDirection } from './types';

/**
 * Pin adjacency graph from ATTACK_BOARD_RULES.md § 7
 */
export const PIN_ADJACENCY: Record<string, string[]> = {
  'QL1': ['QL2', 'KL1', 'KL2'],
  'QL2': ['QL1', 'QL3', 'KL1', 'KL2', 'KL3'],
  'QL3': ['QL2', 'QL4', 'KL2', 'KL3', 'KL4'],
  'QL4': ['QL3', 'QL5', 'KL3', 'KL4', 'KL5'],
  'QL5': ['QL4', 'QL6', 'KL4', 'KL5', 'KL6'],
  'QL6': ['QL5', 'KL5', 'KL6'],
  'KL1': ['KL2', 'QL1', 'QL2'],
  'KL2': ['KL1', 'KL3', 'QL1', 'QL2', 'QL3'],
  'KL3': ['KL2', 'KL4', 'QL2', 'QL3', 'QL4'],
  'KL4': ['KL3', 'KL5', 'QL3', 'QL4', 'QL5'],
  'KL5': ['KL4', 'KL6', 'QL4', 'QL5', 'QL6'],
  'KL6': ['KL5', 'QL5', 'QL6'],
};

/**
 * Checks if two pins are adjacent
 */
export function arePinsAdjacent(fromPinId: string, toPinId: string): boolean {
  const adjacentPins = PIN_ADJACENCY[fromPinId];
  return adjacentPins ? adjacentPins.includes(toPinId) : false;
}

/**
 * Gets all adjacent pins for a given pin
 */
export function getAdjacentPins(pinId: string): string[] {
  return PIN_ADJACENCY[pinId] || [];
}

/**
 * Determines direction of board movement
 * Forward: same side (QL→QL or KL→KL), higher level
 * Side: cross-side (QL↔KL)
 * Backward: same side, lower level (inverted)
 */
export function getBoardMoveDirection(
  fromPinId: string,
  toPinId: string
): BoardDirection {
  const fromSide = fromPinId.startsWith('QL') ? 'QL' : 'KL';
  const toSide = toPinId.startsWith('QL') ? 'QL' : 'KL';

  // Cross-side movement is always "side"
  if (fromSide !== toSide) {
    return 'side';
  }

  // Same side: compare levels
  const fromLevel = parseInt(fromPinId.slice(2));
  const toLevel = parseInt(toPinId.slice(2));

  if (toLevel > fromLevel) {
    return 'forward';
  } else {
    return 'backward';
  }
}

/**
 * Checks if direction is allowed for occupied board
 * Occupied boards can only move forward or side, not backward
 */
export function isDirectionAllowedForOccupied(direction: BoardDirection): boolean {
  return direction === 'forward' || direction === 'side';
}

/**
 * Checks if direction is allowed for empty board
 * Empty boards can move in any direction
 */
export function isDirectionAllowedForEmpty(direction: BoardDirection): boolean {
  return true; // All directions allowed
}
