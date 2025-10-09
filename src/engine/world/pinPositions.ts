import type { PinPosition } from './types';

export const Z_PARAMS = {
  a1: 0.2,
  a2: 0.45,
  a3: 0.7,
  b1: 0.2,
  b2: 0.5,
  b3: 0.8,
};

export function getPinLevelIndex(pinId: string): 1|2|3|4|5|6 {
  const n = Number(pinId.slice(2));
  if (n >= 1 && n <= 6) return n as 1|2|3|4|5|6;
  return 1;
}

export function attackSquareZ(pinId: string): number {
  const level = getPinLevelIndex(pinId);
  const gapWN = Z_NEUTRAL_MAIN - Z_WHITE_MAIN;
  const gapNB = Z_BLACK_MAIN - Z_NEUTRAL_MAIN;
  switch (level) {
    case 1: return Z_WHITE_MAIN + Z_PARAMS.a1 * gapWN;
    case 2: return Z_WHITE_MAIN + Z_PARAMS.a2 * gapWN;
    case 3: return Z_WHITE_MAIN + Z_PARAMS.a3 * gapWN;
    case 4: return Z_NEUTRAL_MAIN + Z_PARAMS.b1 * gapNB;
    case 5: return Z_NEUTRAL_MAIN + Z_PARAMS.b2 * gapNB;
    case 6: return Z_NEUTRAL_MAIN + Z_PARAMS.b3 * gapNB;
    default: return Z_WHITE_MAIN + Z_PARAMS.a1 * gapWN;
  }
}
export const Z_WHITE_MAIN = 0;
export const Z_NEUTRAL_MAIN = 5;
export const Z_BLACK_MAIN = 10;

export const Z_L1 = Z_WHITE_MAIN + 1.0;
export const Z_L2 = Z_WHITE_MAIN + 2.0;
export const Z_L3 = Z_NEUTRAL_MAIN - 1.0;
export const Z_L4 = Z_NEUTRAL_MAIN + 1.0;
export const Z_L5 = Z_BLACK_MAIN - 2.0;
export const Z_L6 = Z_BLACK_MAIN - 1.0;

export const PIN_POSITIONS: Record<string, PinPosition> = {
  QL1: {
    id: 'QL1',
    fileOffset: 0,
    rankOffset: 0,
    zHeight: Z_L1,
    adjacentPins: ['QL2', 'KL1', 'KL2'],
    level: 0,
    inverted: false,
  },
  QL2: {
    id: 'QL2',
    fileOffset: 0,
    rankOffset: 4,
    zHeight: Z_L2,
    adjacentPins: ['QL1', 'QL3', 'KL1', 'KL2', 'KL3'],
    level: 1,
    inverted: false,
  },
  QL3: {
    id: 'QL3',
    fileOffset: 0,
    rankOffset: 2,
    zHeight: Z_L3,
    adjacentPins: ['QL2', 'QL4', 'KL2', 'KL3', 'KL4'],
    level: 2,
    inverted: false,
  },
  QL4: {
    id: 'QL4',
    fileOffset: 0,
    rankOffset: 6,
    zHeight: Z_L4,
    adjacentPins: ['QL3', 'QL5', 'KL3', 'KL4', 'KL5'],
    level: 3,
    inverted: false,
  },
  QL5: {
    id: 'QL5',
    fileOffset: 0,
    rankOffset: 4,
    zHeight: Z_L5,
    adjacentPins: ['QL4', 'QL6', 'KL4', 'KL5', 'KL6'],
    level: 4,
    inverted: false,
  },
  QL6: {
    id: 'QL6',
    fileOffset: 0,
    rankOffset: 8,
    zHeight: Z_L6,
    adjacentPins: ['QL5', 'KL5', 'KL6'],
    level: 5,
    inverted: true,
  },
  KL1: {
    id: 'KL1',
    fileOffset: 4,
    rankOffset: 0,
    zHeight: Z_L1,
    adjacentPins: ['KL2', 'QL1', 'QL2'],
    level: 0,
    inverted: false,
  },
  KL2: {
    id: 'KL2',
    fileOffset: 4,
    rankOffset: 4,
    zHeight: Z_L2,
    adjacentPins: ['KL1', 'KL3', 'QL1', 'QL2', 'QL3'],
    level: 1,
    inverted: false,
  },
  KL3: {
    id: 'KL3',
    fileOffset: 4,
    rankOffset: 2,
    zHeight: Z_L3,
    adjacentPins: ['KL2', 'KL4', 'QL2', 'QL3', 'QL4'],
    level: 2,
    inverted: false,
  },
  KL4: {
    id: 'KL4',
    fileOffset: 4,
    rankOffset: 6,
    zHeight: Z_L4,
    adjacentPins: ['KL3', 'KL5', 'QL3', 'QL4', 'QL5'],
    level: 3,
    inverted: false,
  },
  KL5: {
    id: 'KL5',
    fileOffset: 4,
    rankOffset: 4,
    zHeight: Z_L5,
    adjacentPins: ['KL4', 'KL6', 'QL4', 'QL5', 'QL6'],
    level: 4,
    inverted: false,
  },
  KL6: {
    id: 'KL6',
    fileOffset: 4,
    rankOffset: 8,
    zHeight: Z_L6,
    adjacentPins: ['KL5', 'QL5', 'QL6'],
    level: 5,
    inverted: true,
  },
};

export const PIN_FOOTPRINT: Record<string, { files: [number, number]; ranks: [number, number] }> = {
  QL1: { files: [0, 1], ranks: [0, 1] },
  KL1: { files: [4, 5], ranks: [0, 1] },
  QL2: { files: [0, 1], ranks: [4, 5] },
  KL2: { files: [4, 5], ranks: [4, 5] },
  QL3: { files: [0, 1], ranks: [2, 3] },
  KL3: { files: [4, 5], ranks: [2, 3] },
  QL4: { files: [0, 1], ranks: [5, 6] },
  KL4: { files: [4, 5], ranks: [5, 6] },
  QL5: { files: [0, 1], ranks: [6, 7] },
  KL5: { files: [4, 5], ranks: [6, 7] },
  QL6: { files: [0, 1], ranks: [8, 9] },
  KL6: { files: [4, 5], ranks: [8, 9] },
};

export function getInitialPinPositions(): Record<string, string> {
  return {
    WQL: 'QL1',
    WKL: 'KL1',
    BQL: 'QL6',
    BKL: 'KL6',
  };
}
