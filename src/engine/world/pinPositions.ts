import { PinPosition } from './types';

/**
 * Pin positions for attack boards.
 *
 * CRITICAL: These positions determine where attack boards can be placed.
 * The rankOffset and fileOffset must be chosen so that the resulting
 * squares align with the continuous rank system.
 *
 * VALIDATION REQUIRED: After implementing this, you MUST visually verify
 * that pieces align with squares when boards are at different pins.
 */

export const PIN_POSITIONS: Record<string, PinPosition> = {
  // White Queen-side attack board pins (left side, files z-a)
  QL1: {
    id: 'QL1',
    fileOffset: 0,  // Files z-a (0-1)
    rankOffset: 0,  // Ranks 0-1
    zHeight: 7.5,  // Above white main (Z=5), below neutral (Z=10)
    adjacentPins: ['QL2', 'QL3'],
    level: 0,
    inverted: false,
  },
  QL2: {
    id: 'QL2',
    fileOffset: 0,
    rankOffset: 2,  // Ranks 2-3 (overlaps with W main board)
    zHeight: 7.5,  // Above white main (Z=5), below neutral (Z=10)
    adjacentPins: ['QL1', 'QL3', 'QL4'],
    level: 1,
    inverted: false,
  },
  QL3: {
    id: 'QL3',
    fileOffset: 0,
    rankOffset: 4,  // Ranks 4-5 (overlaps with W/N main boards)
    zHeight: 12.5,  // Above neutral main (Z=10), below black (Z=15)
    adjacentPins: ['QL1', 'QL2', 'QL4', 'QL5'],
    level: 2,
    inverted: false,
  },
  QL4: {
    id: 'QL4',
    fileOffset: 0,
    rankOffset: 6,  // Ranks 6-7 (overlaps with N/B main boards)
    zHeight: 12.5,  // Above neutral main (Z=10), below black (Z=15)
    adjacentPins: ['QL2', 'QL3', 'QL5', 'QL6'],
    level: 3,
    inverted: false,
  },
  QL5: {
    id: 'QL5',
    fileOffset: 0,
    rankOffset: 8,  // Ranks 8-9 (overlaps with B main board)
    zHeight: 17.5,  // Above black main (Z=15)
    adjacentPins: ['QL3', 'QL4', 'QL6'],
    level: 4,
    inverted: false,
  },
  QL6: {
    id: 'QL6',
    fileOffset: 0,
    rankOffset: 8,  // Ranks 8-9 (above B main board)
    zHeight: 17.5,  // Above black main board
    adjacentPins: ['QL4', 'QL5'],
    level: 5,
    inverted: true,  // Inverted at top
  },

  // White King-side attack board pins (right side, files d-e)
  KL1: {
    id: 'KL1',
    fileOffset: 4,  // Files d-e (4-5)
    rankOffset: 0,  // Ranks 0-1
    zHeight: 7.5,  // Above white main (Z=5), below neutral (Z=10)
    adjacentPins: ['KL2', 'KL3'],
    level: 0,
    inverted: false,
  },
  KL2: {
    id: 'KL2',
    fileOffset: 4,
    rankOffset: 2,  // Ranks 2-3 (overlaps with W main board)
    zHeight: 7.5,  // Above white main (Z=5), below neutral (Z=10)
    adjacentPins: ['KL1', 'KL3', 'KL4'],
    level: 1,
    inverted: false,
  },
  KL3: {
    id: 'KL3',
    fileOffset: 4,
    rankOffset: 4,  // Ranks 4-5
    zHeight: 12.5,  // Above neutral main (Z=10), below black (Z=15)
    adjacentPins: ['KL1', 'KL2', 'KL4', 'KL5'],
    level: 2,
    inverted: false,
  },
  KL4: {
    id: 'KL4',
    fileOffset: 4,
    rankOffset: 6,  // Ranks 6-7
    zHeight: 12.5,  // Above neutral main (Z=10), below black (Z=15)
    adjacentPins: ['KL2', 'KL3', 'KL5', 'KL6'],
    level: 3,
    inverted: false,
  },
  KL5: {
    id: 'KL5',
    fileOffset: 4,
    rankOffset: 8,  // Ranks 8-9
    zHeight: 17.5,  // Above black main (Z=15)
    adjacentPins: ['KL3', 'KL4', 'KL6'],
    level: 4,
    inverted: false,
  },
  KL6: {
    id: 'KL6',
    fileOffset: 4,
    rankOffset: 8,  // Ranks 8-9
    zHeight: 17.5,  // Above black main board
    adjacentPins: ['KL4', 'KL5'],
    level: 5,
    inverted: true,
  },
};

/**
 * Get initial pin positions for attack boards at game start.
 */
export function getInitialPinPositions(): Record<string, string> {
  return {
    WQL: 'QL1',  // White queen-side starts at QL1
    WKL: 'KL1',  // White king-side starts at KL1
    BQL: 'QL6',  // Black queen-side starts at QL6
    BKL: 'KL6',  // Black king-side starts at KL6
  };
}
