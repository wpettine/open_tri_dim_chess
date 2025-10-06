import type { PinPosition } from './types';

export const Z_WHITE_MAIN = 0;
export const Z_NEUTRAL_MAIN = 4;
export const Z_BLACK_MAIN = 8;
export const ATTACK_OFFSET = 2;

export const PIN_POSITIONS: Record<string, PinPosition> = {
  QL1: {
    id: 'QL1',
    fileOffset: 0,
    rankOffset: 0,
    zHeight: Z_WHITE_MAIN - ATTACK_OFFSET,
    adjacentPins: ['QL2', 'QL3'],
    level: 0,
    inverted: false,
  },
  QL2: {
    id: 'QL2',
    fileOffset: 0,
    rankOffset: 2,
    zHeight: Z_WHITE_MAIN,
    adjacentPins: ['QL1', 'QL3', 'QL4'],
    level: 1,
    inverted: false,
  },
  QL3: {
    id: 'QL3',
    fileOffset: 0,
    rankOffset: 4,
    zHeight: Z_NEUTRAL_MAIN,
    adjacentPins: ['QL1', 'QL2', 'QL4', 'QL5'],
    level: 2,
    inverted: false,
  },
  QL4: {
    id: 'QL4',
    fileOffset: 0,
    rankOffset: 6,
    zHeight: Z_BLACK_MAIN,
    adjacentPins: ['QL2', 'QL3', 'QL5', 'QL6'],
    level: 3,
    inverted: false,
  },
  QL5: {
    id: 'QL5',
    fileOffset: 0,
    rankOffset: 8,
    zHeight: Z_BLACK_MAIN,
    adjacentPins: ['QL3', 'QL4', 'QL6'],
    level: 4,
    inverted: false,
  },
  QL6: {
    id: 'QL6',
    fileOffset: 0,
    rankOffset: 8,
    zHeight: Z_BLACK_MAIN + ATTACK_OFFSET,
    adjacentPins: ['QL4', 'QL5'],
    level: 5,
    inverted: true,
  },
  KL1: {
    id: 'KL1',
    fileOffset: 4,
    rankOffset: 0,
    zHeight: Z_WHITE_MAIN - ATTACK_OFFSET,
    adjacentPins: ['KL2', 'KL3'],
    level: 0,
    inverted: false,
  },
  KL2: {
    id: 'KL2',
    fileOffset: 4,
    rankOffset: 2,
    zHeight: Z_WHITE_MAIN,
    adjacentPins: ['KL1', 'KL3', 'KL4'],
    level: 1,
    inverted: false,
  },
  KL3: {
    id: 'KL3',
    fileOffset: 4,
    rankOffset: 4,
    zHeight: Z_NEUTRAL_MAIN,
    adjacentPins: ['KL1', 'KL2', 'KL4', 'KL5'],
    level: 2,
    inverted: false,
  },
  KL4: {
    id: 'KL4',
    fileOffset: 4,
    rankOffset: 6,
    zHeight: Z_BLACK_MAIN,
    adjacentPins: ['KL2', 'KL3', 'KL5', 'KL6'],
    level: 3,
    inverted: false,
  },
  KL5: {
    id: 'KL5',
    fileOffset: 4,
    rankOffset: 8,
    zHeight: Z_BLACK_MAIN,
    adjacentPins: ['KL3', 'KL4', 'KL6'],
    level: 4,
    inverted: false,
  },
  KL6: {
    id: 'KL6',
    fileOffset: 4,
    rankOffset: 8,
    zHeight: Z_BLACK_MAIN + ATTACK_OFFSET,
    adjacentPins: ['KL4', 'KL5'],
    level: 5,
    inverted: true,
  },
};

export function getInitialPinPositions(): Record<string, string> {
  return {
    WQL: 'QL1',
    WKL: 'KL1',
    BQL: 'QL6',
    BKL: 'KL6',
  };
}
